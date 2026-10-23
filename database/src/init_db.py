
import psycopg2
import datetime
import destination_set_up
import location_set_up
import weather_set_up

### connect to the database
conn = psycopg2.connect(
    dbname="visitsweden",
    user="visit",
    password="sweden",
    host="localhost",
    port=5434
)



##try to connect
try:
    with conn.cursor() as cur:

        ###get data
        locations = location_set_up.get_locations()
        destinations = destination_set_up.get_all_detinatios()
        i = 0
        for loc in locations:
            
            if loc == None:
                continue
            longitude = loc["longitude"]
            latitude = loc["latitude"]

            #insert locations
            cur.execute(
                """
                INSERT INTO location (location)
                VALUES (
                    ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography
                )
                RETURNING location_id;
                """,
                (longitude, latitude)
            )
            location_id = cur.fetchone()[0]

            for des in destinations:
                if des["location"] != None:
                    if des["location"]["latitude"] == latitude and des["location"]["longitude"] == longitude:
                        #insert destinations
                        cur.execute(
                            """
                            INSERT INTO destination
                                (location_id, name, description, label)
                            VALUES (%s, %s, %s, %s)
                            ON CONFLICT (name) DO NOTHING;

                            """,
                            (
                                location_id,
                                des["name"],
                                des["description"],
                                des["type"],
                            )
                        )
        cur.execute("SELECT current_database(), version();")
        print(cur.fetchone())    
    conn.commit()
finally:
    conn.close()
