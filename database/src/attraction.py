from datetime import date
import json
import psycopg
from psycopg.types.json import Jsonb
import os
import schedule
import requests
import time

DB = dict(
    host=os.getenv("DB_HOST", "localhost"), 
    port=os.getenv("DB_PORT", 5434),
    dbname=os.getenv("DB_NAME", "visitsweden"),
    user=os.getenv("DB_USER", "visit"),
    password=os.getenv("DB_PASSWORD", "sweden")
)

# stockholm openapi
base_url = "https://api.visitstockholm.com"
events_url =  "/api/public-v1/events/"


def response_info(data):
    print(json.dumps(data, indent=2, ensure_ascii=False)[:30])

    print("count: ", data["count"])
    print("total_pages: ", data["total_pages"])
    print("current_page: ", data["current_page"])
    print("next: ", data["next"])
    print("results on this page: ", len(data["results"]))

    print(json.dumps(data["results"][0], indent=2, ensure_ascii=False))

def future_occurrences(event):
    today = date.today().isoformat()
    return [e for e in schedule_entries(event) if e[0] >= today]

def parse_events(event):
    title = event.get("title") or {}
    name = title.get("en") or {}

    location = event.get("location") or {}
    lat, lon = location.get("latitude"), location.get("longitude")

    categories = event.get("categories") or []
    first_category = categories[0]["title"] if categories else None

    url = event.get("external_website_url")

    if name is None or lat is None or lon is None:
        # print(event["id"], event.get("title"), event.get("location"))
        return None

    return {
        "source_id": event["id"],
        "name": name,
        "type": first_category,
        "url": url,
        "lat": lat,
        "lon": lon,
        "occurrences": [
            {"event_date": d, "start_time": s, "end_time": e}
            for d, s, e in future_occurrences(event)
        ],
    }

def insert_attraction(cursor, p):
    cursor.execute(
        "SELECT add_attraction(%s::uuid ,%s, %s, %s, %s, %s, p_occurrences => %s)",
        (p["source_id"], p["name"], p["type"], p["url"], p["lat"], p["lon"], Jsonb(p["occurrences"])),
    )
    return cursor.fetchone()[0]

def fetch_page(page):
    response = requests.get(base_url + events_url, params={"page": page}, timeout=10)
    response.raise_for_status()

    data = response.json()
    if data["current_page"] != page:
        raise RuntimeError(f"asked for page {page}, got {data['current_page']}")
    return data

def fetch_all_events():
    events = {}
    page, total_pages = 1, 1
    while page <= total_pages:
        data = fetch_page(page)
        total_pages = data["total_pages"]
        for event in data["results"]:
            events[event["id"]] = event
        print("pages: ", page)
        page += 1
    return list(events.values())

def schedule_entries(event):
    dates = (event.get("schedule") or {}).get("dates") or []
    return [
        (d["date"], d["start_time"], d["end_time"]) for d in dates if d.get("start_time") and d.get("end_time")
    ]


def attraction_job():
    events = fetch_all_events()

    parsed_events = [p for p in (parse_events(ev) for ev in events) if p]
    print(f"{len(parsed_events)} of {len(events)} can be imported")

    importable = [ev for ev in events if parse_events(ev)]

    today = date.today().isoformat()

    events_with_entries = 0
    future_events = 0
    total_entries = 0
    future_entries = 0
    for ev in importable:
        entries = schedule_entries(ev)
        future = [e for e in entries if e[0] >= today]
        events_with_entries += bool(entries)
        future_events += bool(future)
        total_entries += len(entries)
        future_entries += len(future)

    print(f"events with timed dates:       {events_with_entries}")
    print(f"  ...with a date from today on: {future_events}")
    print(f"timed date entries:            {total_entries}")
    print(f"  ...from today on:            {future_entries}")

    inserted = 0
    with psycopg.connect(**DB) as conn:
        for p in parsed_events:
            try:
                with conn.transaction():
                    with conn.cursor() as cur:
                        insert_attraction(cur, p)
                inserted += 1
            except psycopg.Error as e:
                print(f"skipped {p['name']}: {e}")
    print(f"inserted {inserted} of {len(parsed_events)} events")

def schedule_attraction_job():
    print("scheduled task to run every 10 minutes")
    # schedule.every(10).minutes.do(attraction_job)
    schedule.every().day.at("03:00").do(attraction_job)

    while True:
        schedule.run_pending()
        time.sleep(5)

# ----------------------------------------------------------------------------------------------------------------------

if __name__ == "__main__":
    attraction_job()
    schedule_attraction_job()
    