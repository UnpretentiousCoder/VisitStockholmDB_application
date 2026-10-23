import psycopg2
import datetime
import requests
import sys
import xml.etree.ElementTree as ET

def get_weather_at(lat, lon, alt = 90, date = datetime.datetime.now(datetime.timezone.utc)):
    #log in to api
    headers = {
        "User-Agent": "VisitSweden weather project silasfrycklu@gmail.com"            
    }

    #connet to api
    url = f"https://api.met.no/weatherapi/locationforecast/2.0/classic?lat={lat}&lon={lon}&altitude={alt}"
    response = requests.get(url, headers=headers)

    #check for error
    if response.status_code != 200:
        print("Status:", response.status_code)
        print("Response:", response.text)
        return
    
    #data to roo root tree so easy to map out 
    root = ET.fromstring(response.text)

    temperature = None
    precipitation = None
    weather = None
    
    #find weather for specific time
    for time_element in root.findall(".//time"):
        ##get time for data
        forecast_from = datetime.datetime.fromisoformat(
            time_element.get("from").replace("Z", "+00:00")
        )

        forecast_to = datetime.datetime.fromisoformat(
            time_element.get("to").replace("Z", "+00:00")
        )

        location = time_element.find("location")
        
        if location == None:
            continue

        temp_element = location.find("temperature")
        if temp_element is not None:
                temperature = float(temp_element.get("value"))

                if precipitation is not None:
                    break


        if forecast_from <= date < forecast_to:
            rain_element = location.find("precipitation")
            if rain_element is not None:
                precipitation = float(rain_element.get("value"))

            symbol_element = location.find("symbol")
            if symbol_element is not None:
                weather = symbol_element.get("code")
            
            if temperature is not None:
                break


    return {
        "Temperature": temperature,
        "Precipitation": precipitation,
        "Weather": weather,
    }

