import { useEffect, useState, useRef } from 'react';
import {
  CloudSun,
  Sun,
  CloudRain,
  CloudLightning,
  Cloud,
  MapPin,
  RefreshCw,
  Search,
  ArrowUpRight,
  WifiOff,
  Navigation,
  Check,
  X,
} from 'lucide-react';
import type { Preferences } from '../lib/types';
import { useUI, attempt } from '../lib/store';
import { repository } from '../lib/db';
import { Card, Field } from '../components/ui';
import {
  fetchWeather,
  readWeatherCache,
  weatherLabel,
  searchWeatherCities,
  WEATHER_CACHE_KEY,
  type WeatherLocation,
  type WeatherSnapshot,
} from '../lib/weather';
export function WeatherCard({ profile }: { profile: Preferences }) {
  const location = profile.weatherLocation;
  const [data, setData] = useState<WeatherSnapshot | null>(() =>
      location ? readWeatherCache(location) : null,
    ),
    [loading, setLoading] = useState(false),
    [error, setError] = useState('');
  const refresh = useRef<() => void>(() => {});
  const open = useUI((s) => s.open);
  useEffect(() => {
    if (!location) {
      setData(null);
      setError('');
      return;
    }
    const cached = readWeatherCache(location);
    setData(cached);
    let controller: AbortController | undefined,
      disposed = false;
    const update = async (force = false) => {
      if (!navigator.onLine) {
        setError('离线 · 显示最近一次天气');
        return;
      }
      if (!force && cached && Date.now() - cached.fetchedAt < 900000) return;
      controller?.abort();
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 10000);
      setLoading(true);
      setError('');
      try {
        const next = await fetchWeather(location, controller.signal);
        if (disposed) return;
        setData(next);
        try {
          localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(next));
        } catch {
          /* Weather cache is optional; health record writes remain explicit. */
        }
      } catch (e) {
        if (!disposed) setError('暂时无法更新天气，可稍后重试');
      } finally {
        clearTimeout(timeout);
        if (!disposed) setLoading(false);
      }
    };
    refresh.current = () => {
      void update(true);
    };
    void update();
    const online = () => void update(true);
    const visible = () => {
      if (!document.hidden) void update(true);
    };
    const timer = setInterval(() => {
      if (!document.hidden) void update(true);
    }, 1800000);
    window.addEventListener('online', online);
    document.addEventListener('visibilitychange', visible);
    return () => {
      disposed = true;
      controller?.abort();
      clearInterval(timer);
      window.removeEventListener('online', online);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [location?.latitude, location?.longitude]);
  const code = data?.code ?? 0;
  const Icon =
    code >= 95
      ? CloudLightning
      : code >= 51
        ? CloudRain
        : code > 3
          ? Cloud
          : code > 0
            ? CloudSun
            : Sun;
  return (
    <Card className="weather-card">
      <div className="weather-heading">
        <span className="card-eyebrow">{location?.name ?? '窗外，此刻'}</span>
        <button
          className="icon-button tooltip-anchor"
          data-tooltip="选择天气城市"
          aria-label="选择天气城市"
          onClick={() => open('weather')}
        >
          <MapPin size={17} />
        </button>
      </div>
      {!location ? (
        <div className="weather-unset">
          <CloudSun size={36} strokeWidth={1.35} />
          <div>
            <h3>今天，适合怎样出发？</h3>
            <p>选一座城市，看看天气与温度。</p>
          </div>
          <button className="text-button" onClick={() => open('weather')}>
            设置城市
            <ArrowUpRight size={15} />
          </button>
        </div>
      ) : loading && !data ? (
        <div className="weather-skeleton" aria-label="正在获取天气" role="status">
          <div className="skeleton skeleton-number" />
          <div className="skeleton skeleton-line" />
        </div>
      ) : data ? (
        <>
          <div className="weather-main">
            <div>
              <div className="weather-temperature">
                {Math.round(data.temperature)}
                <span>°</span>
              </div>
            </div>
            <div className="weather-condition">
              <Icon size={40} strokeWidth={1.25} />
              <span>{weatherLabel(code)}</span>
            </div>
          </div>
          <div className="weather-footer">
            <span>
              最高 {Math.round(data.high)}° · 最低 {Math.round(data.low)}°
            </span>
            <button
              className={'icon-button tooltip-anchor ' + (loading ? 'is-refreshing' : '')}
              data-tooltip="更新天气"
              aria-label="更新天气"
              disabled={loading}
              onClick={() => refresh.current()}
            >
              <RefreshCw size={14} />
            </button>
          </div>
          <small className="weather-freshness">
            {error || `数据时间 ${data.time.replace('T', ' ')} · 当地时间`}
          </small>
        </>
      ) : (
        <div className="weather-unavailable">
          <Cloud size={28} />
          <p>{error || '天气还未就绪'}</p>
          <button className="text-button" onClick={() => refresh.current()}>
            重新获取
          </button>
        </div>
      )}
      {location && (
        <a
          className="weather-attribution"
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
        >
          天气数据 Open-Meteo
        </a>
      )}
    </Card>
  );
}
export function WeatherSettings({ profile }: { profile: Preferences }) {
  const [query, setQuery] = useState(''),
    [results, setResults] = useState<WeatherLocation[]>([]),
    [busy, setBusy] = useState(false),
    [searched, setSearched] = useState(false);
  const { close } = useUI();
  async function choose(location: WeatherLocation) {
    await attempt(async () => {
      await repository.profile({ ...profile, weatherLocation: location });
      close();
    }, '天气城市已设置，将在联网时自动更新');
  }
  async function search(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await attempt(async () => {
      setResults(await searchWeatherCities(query));
      setSearched(true);
    });
    setBusy(false);
  }
  return (
    <div className="weather-settings">
      <div className="weather-privacy">
        <CloudSun size={28} />
        <h3>看看天气，再决定怎么出发。</h3>
        <p>
          启用后，城市名称与城市坐标会发送给 Open-Meteo
          获取天气。不会发送任何健康记录。联网时自动刷新，离线显示最近缓存。
        </p>
      </div>
      <form onSubmit={search}>
        <Field label="城市名称">
          <div className="search-field">
            <Search size={18} />
            <input
              required
              minLength={2}
              maxLength={100}
              placeholder="例如：吉隆坡、上海、Kuala Lumpur"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </Field>
        <button disabled={busy} className="button primary full-width">
          {busy ? '正在搜索…' : '搜索城市并启用天气'}
        </button>
      </form>
      <div className="city-results">
        {results.map((r, i) => (
          <button key={i} onClick={() => choose(r)}>
            <MapPin size={19} />
            <span>
              <strong>{r.name}</strong>
              <small>{r.country}</small>
            </span>
            <ArrowUpRight size={16} />
          </button>
        ))}
        {searched && !results.length && <p className="muted">没有找到城市，可以尝试英文名称。</p>}
      </div>
      <div className="weather-coordinates">
        <p className="footnote">
          也可使用当前位置。仅发送四舍五入至 0.01° 的坐标，不保存持续位置轨迹。
        </p>
        <button
          className="button secondary full-width"
          disabled={busy}
          onClick={() => {
            if (!navigator.geolocation) {
              useUI.getState().fail(Error('此浏览器不支持定位，请搜索城市'));
              return;
            }
            setBusy(true);
            navigator.geolocation.getCurrentPosition(
              (p) => {
                void choose({
                  name: '当前位置',
                  latitude: Math.round(p.coords.latitude * 100) / 100,
                  longitude: Math.round(p.coords.longitude * 100) / 100,
                }).finally(() => setBusy(false));
              },
              () => {
                useUI.getState().fail(Error('无法获取位置，请直接搜索城市'));
                setBusy(false);
              },
              { timeout: 12000, maximumAge: 300000 },
            );
          }}
        >
          <Navigation size={16} />
          使用当前位置并启用天气
        </button>
      </div>
      {profile.weatherLocation && (
        <button
          className="text-button danger full-width"
          onClick={() =>
            attempt(async () => {
              await repository.profile({ ...profile, weatherLocation: undefined });
              localStorage.removeItem(WEATHER_CACHE_KEY);
              close();
            }, '天气联网已关闭')
          }
        >
          关闭天气联网并清除天气缓存
        </button>
      )}
      <p className="footnote">
        温度单位 °C。天气为模型数据，非本地传感器实测。来源：
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
          Open-Meteo（CC BY 4.0）
        </a>
        。
      </p>
    </div>
  );
}
