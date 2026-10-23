import datetime
import requests
import sys
import xml.etree.ElementTree as ET
import json




def get_locations():
    locations = []

    #cinect to api
    url = f"https://api.visitstockholm.com/api/public-v1/objects/?page=1&size=1"
    response = requests.get(url)
    data = response.json()
    i = data["count"]

    #get all locations
    url = f"https://api.visitstockholm.com/api/public-v1/objects/?page=1&size={i}"
    response = requests.get(url)
    data = response.json()

    #extort wanted information
    for j in range(i):

        locations.append(data["results"][j]["location"])
        print(j)

    return locations