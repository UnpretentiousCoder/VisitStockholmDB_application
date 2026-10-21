import { 
  DistrictWeather, 
  HourlyWeatherItem, 
  DailyWeatherItem, 
  StockholmWeatherSummary, 
  WeatherCondition,
  District 
} from '../types';

export function getStockholmDefaultWeather(): StockholmWeatherSummary {
  const now = new Date();
  const dateFormatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  const timeFormatted = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} CET`;

  const districts: DistrictWeather[] = [
    {
      district: 'Gamla Stan',
      temperatureC: 8.4,
      feelsLikeC: 6.2,
      rainfallMm: 0.1,
      rainProbabilityPercent: 20,
      weatherType: 'Crisp Maritime Breeze',
      condition: 'partly-cloudy',
      humidityPercent: 74,
      windSpeedKmh: 14,
      windDirection: 'WNW',
      uvIndex: 2,
      advisory: 'Sheltered cobblestone alleys provide good wind protection. Ideal for walking around the Royal Palace.',
      ferryStatus: 'smooth',
      bestActivity: 'Stroll cobblestone alleys, visit the Royal Treasury, historic cellar cafes',
    },
    {
      district: 'Djurgården',
      temperatureC: 7.6,
      feelsLikeC: 4.8,
      rainfallMm: 0.4,
      rainProbabilityPercent: 35,
      weatherType: 'Light Coastal Showers',
      condition: 'light-rain',
      humidityPercent: 82,
      windSpeedKmh: 18,
      windDirection: 'NW',
      uvIndex: 1,
      advisory: 'Coastal dampness off the canal. Bring a light windbreaker or raincoat when visiting Skansen.',
      ferryStatus: 'moderate',
      bestActivity: 'Indoor exploration at Vasamuseet and ABBA The Museum; greenhouse fika at Rosendals',
    },
    {
      district: 'Norrmalm',
      temperatureC: 9.2,
      feelsLikeC: 7.5,
      rainfallMm: 0.0,
      rainProbabilityPercent: 15,
      weatherType: 'Mild Urban Autumn',
      condition: 'partly-cloudy',
      humidityPercent: 68,
      windSpeedKmh: 10,
      windDirection: 'W',
      uvIndex: 2,
      advisory: 'Urban heat retention makes the commercial city center the mildest district today.',
      ferryStatus: 'smooth',
      bestActivity: 'Shopping on Drottninggatan, classic bakery tea salons like Vete-Katten',
    },
    {
      district: 'Södermalm',
      temperatureC: 7.9,
      feelsLikeC: 5.1,
      rainfallMm: 0.2,
      rainProbabilityPercent: 25,
      weatherType: 'Breezy Elevated Vistas',
      condition: 'overcast',
      humidityPercent: 76,
      windSpeedKmh: 19,
      windDirection: 'WNW',
      uvIndex: 2,
      advisory: 'High cliff exposure along Monteliusvägen boardwalk. Panoramic visibility is crisp but windy.',
      ferryStatus: 'moderate',
      bestActivity: 'Monteliusvägen cliff walk photography, SoFo vintage shops and warming meatballs',
    },
    {
      district: 'Östermalm',
      temperatureC: 8.1,
      feelsLikeC: 5.7,
      rainfallMm: 0.2,
      rainProbabilityPercent: 22,
      weatherType: 'Baltic Shore Wind',
      condition: 'overcast',
      humidityPercent: 73,
      windSpeedKmh: 16,
      windDirection: 'W',
      uvIndex: 2,
      advisory: 'Moderate breezes along Strandvägen promenade and Nybroviken boat slips.',
      ferryStatus: 'smooth',
      bestActivity: 'Strandvägen waterfront walk, Östermalm Saluhall food hall dining',
    },
    {
      district: 'Skeppsholmen',
      temperatureC: 7.5,
      feelsLikeC: 4.5,
      rainfallMm: 0.5,
      rainProbabilityPercent: 40,
      weatherType: 'Maritime Harbor Swell',
      condition: 'light-rain',
      humidityPercent: 84,
      windSpeedKmh: 21,
      windDirection: 'NW',
      uvIndex: 1,
      advisory: 'Surrounded by open harbor waters. Ferry 82 crossing is brisk with light sea spray on outer decks.',
      ferryStatus: 'moderate',
      bestActivity: 'Contemporary art indoors at Moderna Museet, scenic maritime bridge views',
    },
    {
      district: 'Vasastan',
      temperatureC: 8.8,
      feelsLikeC: 6.9,
      rainfallMm: 0.1,
      rainProbabilityPercent: 18,
      weatherType: 'Calm Northern Overcast',
      condition: 'overcast',
      humidityPercent: 71,
      windSpeedKmh: 11,
      windDirection: 'W',
      uvIndex: 2,
      advisory: 'Inland street grid remains sheltered. Low precipitation probability.',
      bestActivity: 'Artisanal coffee and cardamom knots at Café Pascal near Odenplan',
      ferryStatus: 'smooth',
    },
    {
      district: 'Kungsholmen',
      temperatureC: 8.3,
      feelsLikeC: 6.0,
      rainfallMm: 0.1,
      rainProbabilityPercent: 20,
      weatherType: 'Fresh Lake Mälaren Air',
      condition: 'partly-cloudy',
      humidityPercent: 72,
      windSpeedKmh: 13,
      windDirection: 'W',
      uvIndex: 2,
      advisory: 'Fresh breezes off Lake Mälaren. Waterside promenade at City Hall is clear and pleasant.',
      bestActivity: 'Stockholm City Hall courtyard architecture tour and waterfront stroll',
      ferryStatus: 'smooth',
    },
  ];

  const hourly: HourlyWeatherItem[] = [
    { hour: 6, hourLabel: '06:00', tempC: 5.2, rainMm: 0.0, rainProbability: 10, condition: 'overcast', weatherType: 'Overcast Dawn' },
    { hour: 8, hourLabel: '08:00', tempC: 6.4, rainMm: 0.1, rainProbability: 15, condition: 'partly-cloudy', weatherType: 'Crisp Morning Sun' },
    { hour: 10, hourLabel: '10:00', tempC: 7.8, rainMm: 0.1, rainProbability: 20, condition: 'partly-cloudy', weatherType: 'Partly Cloudy' },
    { hour: 12, hourLabel: '12:00', tempC: 9.2, rainMm: 0.2, rainProbability: 25, condition: 'overcast', weatherType: 'Mild Overcast' },
    { hour: 14, hourLabel: '14:00', tempC: 9.8, rainMm: 0.3, rainProbability: 35, condition: 'light-rain', weatherType: 'Light Showers' },
    { hour: 16, hourLabel: '16:00', tempC: 8.7, rainMm: 0.4, rainProbability: 30, condition: 'light-rain', weatherType: 'Baltic Drizzle' },
    { hour: 18, hourLabel: '18:00', tempC: 7.6, rainMm: 0.1, rainProbability: 20, condition: 'overcast', weatherType: 'Cooling Dusk' },
    { hour: 20, hourLabel: '20:00', tempC: 6.5, rainMm: 0.0, rainProbability: 15, condition: 'partly-cloudy', weatherType: 'Clear Evening' },
    { hour: 22, hourLabel: '22:00', tempC: 5.8, rainMm: 0.0, rainProbability: 10, condition: 'clear', weatherType: 'Chilly Nordic Night' },
  ];

  const daily: DailyWeatherItem[] = [
    { dayName: 'Today', dateLabel: '18 Oct', tempHighC: 10, tempLowC: 5, rainProbability: 28, condition: 'partly-cloudy', weatherType: 'Partly Cloudy' },
    { dayName: 'Mon', dateLabel: '19 Oct', tempHighC: 9, tempLowC: 4, rainProbability: 45, condition: 'light-rain', weatherType: 'Scattered Rain' },
    { dayName: 'Tue', dateLabel: '20 Oct', tempHighC: 11, tempLowC: 6, rainProbability: 15, condition: 'clear', weatherType: 'Crisp Sun' },
    { dayName: 'Wed', dateLabel: '21 Oct', tempHighC: 10, tempLowC: 5, rainProbability: 20, condition: 'partly-cloudy', weatherType: 'Nordic Light' },
    { dayName: 'Thu', dateLabel: '22 Oct', tempHighC: 8, tempLowC: 3, rainProbability: 55, condition: 'rain', weatherType: 'Autumn Showers' },
    { dayName: 'Fri', dateLabel: '23 Oct', tempHighC: 9, tempLowC: 4, rainProbability: 10, condition: 'clear', weatherType: 'Sunny & Crisp' },
    { dayName: 'Sat', dateLabel: '24 Oct', tempHighC: 10, tempLowC: 5, rainProbability: 30, condition: 'overcast', weatherType: 'Overcast' },
  ];

  return {
    currentDateFormatted: dateFormatted,
    currentTimeFormatted: timeFormatted,
    overallTempC: 8.3,
    overallFeelsLikeC: 6.1,
    overallRainfallMm: 0.2,
    overallRainProbability: 24,
    overallWeatherType: 'Crisp Autumn Overcast & Light Maritime Breeze',
    overallCondition: 'partly-cloudy',
    overallHumidity: 74,
    overallWindKmh: 15,
    districts,
    hourly,
    daily,
  };
}

// Optional live meteorological data fetch from Open-Meteo
export async function fetchLiveStockholmWeather(): Promise<StockholmWeatherSummary> {
  const defaultWeather = getStockholmDefaultWeather();
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=59.3293&longitude=18.0686&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,precipitation,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FBerlin';
    
    const res = await fetch(url);
    if (!res.ok) return defaultWeather;
    
    const data = await res.json();
    if (!data.current) return defaultWeather;

    const currentTemp = Math.round(data.current.temperature_2m * 10) / 10;
    const currentFeels = Math.round(data.current.apparent_temperature * 10) / 10;
    const currentPrecip = Math.round(data.current.precipitation * 10) / 10;
    const currentHumidity = Math.round(data.current.relative_humidity_2m);
    const currentWind = Math.round(data.current.wind_speed_10m);

    // Map weather code to condition
    const condition = mapWeatherCodeToCondition(data.current.weather_code);
    const weatherType = mapConditionToDescription(condition, currentTemp);

    // Adjust districts relative to live base
    const liveDistricts = defaultWeather.districts.map(d => {
      const offset = d.district === 'Norrmalm' ? 0.9 : (d.district === 'Skeppsholmen' || d.district === 'Djurgården' ? -0.7 : -0.2);
      return {
        ...d,
        temperatureC: Math.round((currentTemp + offset) * 10) / 10,
        feelsLikeC: Math.round((currentFeels + offset) * 10) / 10,
        rainfallMm: Math.max(0, Math.round((currentPrecip + (d.rainfallMm - 0.2)) * 10) / 10),
        condition,
        weatherType,
        humidityPercent: currentHumidity,
        windSpeedKmh: currentWind,
      };
    });

    return {
      ...defaultWeather,
      overallTempC: currentTemp,
      overallFeelsLikeC: currentFeels,
      overallRainfallMm: currentPrecip,
      overallHumidity: currentHumidity,
      overallWindKmh: currentWind,
      overallCondition: condition,
      overallWeatherType: weatherType,
      districts: liveDistricts,
    };
  } catch (err) {
    console.warn('Using offline Stockholm meteorological data:', err);
    return defaultWeather;
  }
}

function mapWeatherCodeToCondition(code: number): WeatherCondition {
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'partly-cloudy';
  if (code === 3) return 'overcast';
  if (code >= 51 && code <= 55) return 'drizzle';
  if (code >= 61 && code <= 65) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'light-rain';
  return 'overcast';
}

function mapConditionToDescription(condition: WeatherCondition, temp: number): string {
  if (condition === 'clear') return temp < 10 ? 'Crisp Nordic Sun' : 'Sunny & Pleasant';
  if (condition === 'partly-cloudy') return 'Partly Sunny & Nordic Breeze';
  if (condition === 'overcast') return 'Calm Baltic Overcast';
  if (condition === 'light-rain' || condition === 'drizzle') return 'Light Coastal Showers';
  if (condition === 'rain') return 'Autumn Baltic Rain';
  if (condition === 'snow') return 'Nordic Snow Flurries';
  return 'Cool Nordic Atmosphere';
}

