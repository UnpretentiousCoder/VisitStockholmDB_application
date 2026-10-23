import psycopg2
import time
import requests
import sys


def get_all_detinatios():
    destionations = []

    #get number of destionations
    url = f"https://api.visitstockholm.com/api/public-v1/objects/?page=1&size=1"
    response = requests.get(url)
    data = response.json()
    i = data["count"]

    #get all destionations
    url = f"https://api.visitstockholm.com/api/public-v1/objects/?page=1&size={i}"
    response = requests.get(url)
    data = response.json()

    #extraxt data we want
    for j in range(i):
        result = data["results"][j]
        if result["location"] is not None:
            destionations.append({
                "name": result["title"],
                "description": result["text"],
                "type": result["label"],
                "Url": result["contact"]["href"],
                "location": result["location"],
                })
        
    return destionations


