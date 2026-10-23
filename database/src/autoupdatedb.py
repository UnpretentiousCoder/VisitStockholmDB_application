import psycopg2
import time
import requests
import sys

# connect to database
conn = psycopg2.connect(
   database="postgres",
    user='visit',
    password='sweden',
    host='localhost',
    port= '5432'
)

cursor = conn.cursor()

while True:
    # every 15 mins
    time.sleep(900)

    # empty all databases
    sql='TRUNCATE Destination, Accommodation, Attraction, Weather;'
    cursor.execute(sql)

    ###conect api
    url = "https://api.visitstockholm.com/api/public-v1/events/?page=1&size=10"
    response = requests.get(url)

    if response != 200:
        print("Coonecting to visit stockholm api failed", file=sys.stderr)
        break


    ##### todo: get data from api add it to database
    conn.commit()
