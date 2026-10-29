export interface WeatherLocation {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
}
export interface WeatherSnapshot {
  temperature: number;
  apparent: number;
  code: number;
  wind: number;
  high: number;
  low: number;
  time: string;
  timezone: string;
  fetchedAt: number;
  location: WeatherLocation;
}
export function validWeatherLocation(v: unknown): v is WeatherLocation {
  if (!v || typeof v !== 'object') return false;
  const o = v as WeatherLocation;
  return (
    typeof o.name === 'string' &&
    o.name.length > 0 &&
    o.name.length <= 150 &&
    Number.isFinite(o.latitude) &&
    Math.abs(o.latitude) <= 90 &&
    Number.isFinite(o.longitude) &&
    Math.abs(o.longitude) <= 180
  );
}
export function parseWeather(raw: unknown, location: WeatherLocation): WeatherSnapshot {
  const o = raw as {
    current?: Record<string, unknown>;
    daily?: Record<string, unknown[]>;
    timezone?: string;
  };
  const c = o?.current,
    d = o?.daily;
  const numbers = [
    c?.temperature_2m,
    c?.apparent_temperature,
    c?.weather_code,
    c?.wind_speed_10m,
    d?.temperature_2m_max?.[0],
    d?.temperature_2m_min?.[0],
  ];
  if (
    !validWeatherLocation(location) ||
    !numbers.every((x) => typeof x === 'number' && Number.isFinite(x)) ||
    typeof c?.time !== 'string'
  )
    throw Error('天气服务暂时返回了不完整数据，请稍后重试');
  return {
    temperature: numbers[0] as number,
    apparent: numbers[1] as number,
    code: numbers[2] as number,
    wind: numbers[3] as number,
    high: numbers[4] as number,
    low: numbers[5] as number,
    time: c!.time as string,
    timezone: o.timezone ?? 'auto',
    fetchedAt: Date.now(),
    location,
  };
}
export function weatherLabel(code: number) {
  if (code === 0) return '晴朗';
  if (code <= 3) return '多云';
  if ([45, 48].includes(code)) return '有雾';
  if (code >= 51 && code <= 57) return '毛毛雨';
  if (code >= 61 && code <= 67) return '下雨';
  if (code >= 71 && code <= 77) return '下雪';
  if (code >= 80 && code <= 82) return '阵雨';
  if (code >= 85 && code <= 86) return '阵雪';
  if (code >= 95) return '雷雨';
  return '天气变化中';
}
export const WEATHER_CACHE_KEY = 'vital-weather-cache-v1';
export function readWeatherCache(location: WeatherLocation): WeatherSnapshot | null {
  try {
    const v = JSON.parse(
      localStorage.getItem(WEATHER_CACHE_KEY) ?? 'null',
    ) as WeatherSnapshot | null;
    return v &&
      validWeatherLocation(v.location) &&
      v.location.latitude === location.latitude &&
      v.location.longitude === location.longitude &&
      [v.temperature, v.apparent, v.code, v.wind, v.high, v.low, v.fetchedAt].every(
        Number.isFinite,
      ) &&
      typeof v.time === 'string'
      ? v
      : null;
  } catch {
    return null;
  }
}
async function fetchJSON(url: string, signal?: AbortSignal) {
  const response = await fetch(url, {
    signal: signal ?? AbortSignal.timeout(10000),
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  });
  if (!response.ok) throw Error('天气服务暂时无法连接，请稍后重试');
  return response.json();
}
export async function fetchWeather(location: WeatherLocation, signal?: AbortSignal) {
  if (!validWeatherLocation(location)) throw Error('请先选择有效城市');
  const q = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min',
    forecast_days: '1',
    timezone: 'auto',
  });
  return parseWeather(
    await fetchJSON('https://api.open-meteo.com/v1/forecast?' + q, signal),
    location,
  );
}
export async function searchWeatherCities(query: string): Promise<WeatherLocation[]> {
  if (query.trim().length < 2) throw Error('请输入至少两个字符的城市名称');
  const q = new URLSearchParams({ name: query.trim(), count: '6', language: 'zh', format: 'json' });
  const raw = (await fetchJSON('https://geocoding-api.open-meteo.com/v1/search?' + q)) as {
    results?: {
      name: string;
      latitude: number;
      longitude: number;
      country?: string;
      admin1?: string;
    }[];
  };
  return (raw.results ?? [])
    .map((x) => ({
      name: x.name,
      latitude: x.latitude,
      longitude: x.longitude,
      country: [x.admin1, x.country].filter(Boolean).join(' · '),
    }))
    .filter(validWeatherLocation);
}
