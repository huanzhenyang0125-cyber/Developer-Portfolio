import { useEffect, useState } from 'react';
import {
  Footprints,
  Play,
  Pause,
  Square,
  Plus,
  Search,
  MapPin,
  Route,
  Timer,
  Bookmark,
  Trash2,
  Check,
  RotateCcw,
  Dribbble,
  CircleDot,
  Bike,
} from 'lucide-react';
import type { Entry, Preferences, RoutePoint, Template } from '../lib/types';
import { elapsed, fmt, makeEntry, uid, routeDistance, validPoint, volume } from '../lib/domain';
import { db, repository } from '../lib/db';
import { useUI, attempt } from '../lib/store';
import { exercises } from '../lib/catalog';
import { Card, Section, Empty } from '../components/ui';
import { EntryList } from './Today';
export function useWorkoutTracking(active: Entry | undefined) {
  useEffect(() => {
    if (!active || active.status !== 'active') return;
    const id = active.id;
    let watch: number | undefined;
    const checkpoint = setInterval(() => {
      void db.entries
        .update(id, { updatedAt: new Date().toISOString() })
        .catch(useUI.getState().fail);
    }, 15000);
    if (active.activityType === 'outdoor') {
      const pause = () =>
        void db.entries
          .update(id, {
            status: 'paused',
            pausedAt: Date.now(),
            updatedAt: new Date().toISOString(),
          })
          .catch(useUI.getState().fail);
      if (!navigator.geolocation) {
        useUI.getState().fail(Error('此浏览器不支持定位。仍可手动记录运动。'));
        pause();
      } else
        watch = navigator.geolocation.watchPosition(
          (position) => {
            void db
              .transaction('rw', db.entries, async () => {
                const e = await db.entries.get(id);
                if (!e || e.status !== 'active') return;
                const point: RoutePoint = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                  time: position.timestamp,
                  accuracy: position.coords.accuracy,
                  segment: e.pausedMs ?? 0,
                };
                const route = e.route ?? [];
                if (validPoint(point, route.at(-1), e.name)) {
                  const next = [...route, point];
                  await repository.save({ ...e, route: next, distance: routeDistance(next) });
                }
              })
              .catch(useUI.getState().fail);
          },
          () => {
            useUI
              .getState()
              .fail(Error('无法获取定位。请在浏览器设置中允许位置权限，或手动记录本次运动。'));
            pause();
          },
          { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 },
        );
      const visibility = () => {
        if (document.hidden) {
          pause();
          useUI.getState().notify('户外记录已暂停。回到应用后可继续，后台路线不会被补算。');
        }
      };
      document.addEventListener('visibilitychange', visibility);
      return () => {
        clearInterval(checkpoint);
        if (watch != null) navigator.geolocation.clearWatch(watch);
        document.removeEventListener('visibilitychange', visibility);
      };
    }
    return () => clearInterval(checkpoint);
  }, [active?.id, active?.status]);
}
export function RouteView({ points }: { points: RoutePoint[] }) {
  if (points.length < 2)
    return (
      <div className="route-empty">
        <MapPin size={24} />
        <p>等待足够的有效 GPS 点</p>
        <small>请保持应用在前台，并在开阔处开始。</small>
      </div>
    );
  const lat = points.map((p) => p.lat),
    lng = points.map((p) => p.lng);
  const minLat = lat.reduce((a, b) => Math.min(a, b), lat[0]),
    minLng = lng.reduce((a, b) => Math.min(a, b), lng[0]);
  const cos = Math.cos((points[0].lat * Math.PI) / 180);
  const span = Math.max(
    (lng.reduce((a, b) => Math.max(a, b), lng[0]) - minLng) * cos,
    lat.reduce((a, b) => Math.max(a, b), lat[0]) - minLat,
    0.00001,
  );
  const project = (p: RoutePoint) =>
    `${30 + (((p.lng - minLng) * cos) / span) * 240},${270 - ((p.lat - minLat) / span) * 240}`;
  const segments = [...new Set(points.map((p) => p.segment))];
  return (
    <div className="route-map">
      <svg
        viewBox="0 0 300 300"
        role="img"
        aria-label={`已记录 ${points.length} 个位置点的路线示意图，北向上`}
      >
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth=".4" />
          </pattern>
        </defs>
        <rect width="300" height="300" fill="url(#grid)" opacity=".2" />
        {segments.map((s) => (
          <polyline
            key={s}
            points={points
              .filter((p) => p.segment === s)
              .map(project)
              .join(' ')}
            fill="none"
            stroke="var(--mint)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        <circle
          cx={project(points[0]).split(',')[0]}
          cy={project(points[0]).split(',')[1]}
          r="5"
          fill="var(--blue)"
        />
        <circle
          cx={project(points.at(-1)!).split(',')[0]}
          cy={project(points.at(-1)!).split(',')[1]}
          r="5"
          fill="var(--mint)"
        />
      </svg>
      <span>北 ↑ · 本地 GPS 路线示意，不含地图底图</span>
    </div>
  );
}
export function Activity({
  entries,
  profile,
  templates,
}: {
  entries: Entry[];
  profile: Preferences;
  templates: Template[];
}) {
  const { open, day } = useUI();
  const [search, setSearch] = useState(''),
    [category, setCategory] = useState('全部'),
    [tick, setTick] = useState(Date.now());
  const active = entries.find((e) => e.kind === 'workout' && e.status !== 'done');
  const history = entries
    .filter((e) => e.kind === 'workout' && e.status === 'done')
    .sort((a, b) => b.date.localeCompare(a.date));
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active?.id]);
  const bests = history
    .flatMap((e) => (e.sets ?? []).filter((s) => s.done).map((s) => ({ ...s, date: e.date })))
    .reduce<Record<string, { weight: number; reps: number; date: string }>>((acc, s) => {
      if (!acc[s.exercise] || s.weight > acc[s.exercise].weight)
        acc[s.exercise] = { weight: s.weight, reps: s.reps, date: s.date };
      return acc;
    }, {});
  const save = (e: Entry) => attempt(() => repository.save(e));
  async function start(name: string, type: string, sets: Entry['sets'] = []) {
    if (active) {
      useUI.getState().notify('请先结束当前运动');
      return;
    }
    await attempt(
      () =>
        repository.save({
          ...makeEntry('workout', name, day),
          activityType: type,
          start: Date.now(),
          status: 'active',
          pausedMs: 0,
          sets,
          route: [],
        }),
      '运动已开始',
    );
  }
  return (
    <>
      <div className="page-intro">
        <span className="page-symbol mint">
          <Footprints size={24} />
        </span>
        <div>
          <h2>每一次出发，都算数。</h2>
          <p>按自己的节奏动起来，记录身体的每一点进步。</p>
        </div>
        <button className="button primary" onClick={() => open('workout')}>
          <Plus size={18} />
          手动记录
        </button>
      </div>
      {active ? (
        <Card className="live-workout">
          <div className="flex justify-between items-center">
            <div>
              <span className="tag">
                <span className={active.status === 'active' ? 'live-dot' : ''} />
                {active.status === 'active' ? '正在运动' : '已暂停'}
              </span>
              <h2>{active.name}</h2>
            </div>
            <Timer size={27} />
          </div>
          <div className="workout-clock">
            {new Date(elapsed(active, tick) * 1000).toISOString().slice(11, 19)}
          </div>
          <div className="session-stats">
            {active.activityType === 'cardio' ? (
              <p className="footnote">
                这段时间，只专注于{active.name}。记录运动时长；强度与感受可在完成后补充。
              </p>
            ) : (
              <>
                <span>
                  <strong>{fmt((active.distance ?? 0) / 1000, 2)}</strong> km
                </span>
                <span>
                  <strong>
                    {active.distance
                      ? fmt(elapsed(active, tick) / 60 / (active.distance / 1000), 1)
                      : '—'}
                  </strong>{' '}
                  分 / km
                </span>
                <span>
                  <strong>{fmt(volume(active.sets))}</strong> kg 总训练量
                </span>
              </>
            )}
          </div>
          {active.activityType === 'outdoor' && (
            <>
              <RouteView points={active.route ?? []} />
              <p className="footnote">
                定位仅在前台有效。切换应用或锁屏时会暂停；恢复后不连接跨暂停路线。
              </p>
            </>
          )}
          {active.sets?.map((s, i) => (
            <div className="set-row" key={i}>
              <button
                className={'check-button ' + (s.done ? 'checked' : '')}
                aria-label={`第 ${i + 1} 组完成状态`}
                onClick={() =>
                  save({
                    ...active,
                    sets: active.sets!.map((x, j) => (i === j ? { ...x, done: !x.done } : x)),
                  })
                }
              >
                <Check size={16} />
              </button>
              <span>
                {s.exercise}
                <small>
                  第 {i + 1} 组 · 休息 {s.rest} 秒
                </small>
              </span>
              <input
                aria-label="重量 kg"
                type="number"
                min="0"
                max="1000"
                value={s.weight}
                onChange={(e) =>
                  save({
                    ...active,
                    sets: active.sets!.map((x, j) =>
                      i === j
                        ? { ...x, weight: Math.max(0, Math.min(1000, Number(e.target.value))) }
                        : x,
                    ),
                  })
                }
              />
              <small>kg ×</small>
              <input
                aria-label="次数"
                type="number"
                min="1"
                max="1000"
                value={s.reps}
                onChange={(e) =>
                  save({
                    ...active,
                    sets: active.sets!.map((x, j) =>
                      i === j
                        ? { ...x, reps: Math.max(1, Math.min(1000, Number(e.target.value))) }
                        : x,
                    ),
                  })
                }
              />
            </div>
          ))}
          <div className="toolbar">
            <button
              className="button secondary"
              onClick={() =>
                save(
                  active.status === 'active'
                    ? { ...active, status: 'paused', pausedAt: Date.now() }
                    : {
                        ...active,
                        status: 'active',
                        pausedMs:
                          (active.pausedMs ?? 0) + Date.now() - (active.pausedAt ?? Date.now()),
                        pausedAt: undefined,
                      },
                )
              }
            >
              {active.status === 'active' ? <Pause size={17} /> : <Play size={17} />}
              {active.status === 'active' ? '暂停' : '继续'}
            </button>
            <button
              className="button primary"
              onClick={() =>
                save({ ...active, status: 'done', end: Date.now(), duration: elapsed(active) })
              }
            >
              <Square size={16} />
              完成运动
            </button>
            <button
              className="icon-button danger"
              aria-label="放弃运动"
              onClick={() => {
                if (confirm('放弃本次运动？已记录的组数和路线将被删除。'))
                  void attempt(() => repository.remove(active.id));
              }}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </Card>
      ) : (
        <div className="activity-starts">
          {[
            ['篮球', '约一场，找回在场上的节奏'],
            ['羽毛球', '轻快挥拍，给自己一点活力'],
            ['户外步行', '把日常走成风景'],
            ['户外跑步', '给自己一段流动的时间'],
            ['户外骑行', '去感受风的方向'],
          ].map(([name, subtitle], i) => (
            <button
              className={'card activity-start ' + ['blue', 'blue', 'blue', 'blue', 'blue'][i]}
              key={name}
              onClick={() =>
                start(name, name === '篮球' || name === '羽毛球' ? 'cardio' : 'outdoor')
              }
            >
              <div className="flex items-center justify-between">
                <span className="icon-box">
                  {name === '篮球' ? (
                    <Dribbble size={23} />
                  ) : name === '羽毛球' ? (
                    <CircleDot size={23} />
                  ) : name === '户外骑行' ? (
                    <Bike size={23} />
                  ) : (
                    <Footprints size={23} />
                  )}
                </span>
                <Play size={19} />
              </div>
              <h3>{name}</h3>
              <p>{subtitle}</p>
              <small>
                <MapPin size={12} />
                {name === '篮球' || name === '羽毛球' ? '专注运动 · 计时记录' : '前台 GPS 记录'}
              </small>
            </button>
          ))}
        </div>
      )}
      <div className="activity-columns">
        <Section
          title="动作资料库"
          action={`${exercises.length} 个动作`}
          onClick={() => {
            setSearch('');
            setCategory('全部');
          }}
        >
          <Card>
            <div className="search-field">
              <Search size={18} />
              <input
                aria-label="搜索运动"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索动作、肌群或英文名称"
              />
            </div>
            <div className="pills">
              {['全部', ...new Set(exercises.map((e) => e.category))].map((c) => (
                <button
                  key={c}
                  className={c === category ? 'selected' : ''}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="exercise-list">
              {exercises
                .filter(
                  (e) =>
                    (category === '全部' || e.category === category) &&
                    (e.name + e.english + e.equipment).toLowerCase().includes(search.toLowerCase()),
                )
                .map((e) => (
                  <button
                    key={e.name}
                    className="exercise-row"
                    onClick={() =>
                      active
                        ? e.type === 'strength'
                          ? save({
                              ...active,
                              sets: [
                                ...(active.sets ?? []),
                                { exercise: e.name, weight: 0, reps: 10, done: false, rest: 90 },
                              ],
                            })
                          : useUI
                              .getState()
                              .notify('当前运动中可添加力量动作；其他运动请结束后新建。')
                        : start(
                            e.name,
                            e.type,
                            e.type === 'strength'
                              ? [{ exercise: e.name, weight: 0, reps: 10, done: false, rest: 90 }]
                              : [],
                          )
                    }
                  >
                    <span className="exercise-letter">{e.category.slice(0, 1)}</span>
                    <span>
                      <strong>{e.name}</strong>
                      <small>
                        {e.english} · {e.equipment}
                      </small>
                    </span>
                    <Plus size={17} />
                  </button>
                ))}
            </div>
          </Card>
        </Section>
        <div>
          <Section title="训练概览">
            <Card>
              <div className="stat-pair">
                <div>
                  <strong>{history.length}</strong>
                  <span>累计记录 / 次</span>
                </div>
                <div>
                  <strong>{fmt(history.reduce((n, e) => n + (e.duration ?? 0), 0) / 60)}</strong>
                  <span>累计时间 / 分钟</span>
                </div>
              </div>
              <p className="footnote">每周目标 {profile.workouts} 次。仅统计已完成的运动。</p>
            </Card>
          </Section>
          <Section title="训练模板">
            <Card>
              {templates.filter((t) => t.kind === 'workout').length ? (
                templates
                  .filter((t) => t.kind === 'workout')
                  .map((t) => (
                    <div className="template-row" key={t.id}>
                      <Bookmark size={19} />
                      <span>{t.name}</span>
                      <button
                        className="icon-button"
                        aria-label={'开始' + t.name}
                        onClick={() =>
                          start(
                            t.name,
                            t.entries[0]?.activityType ?? 'strength',
                            t.entries[0]?.sets?.map((s) => ({ ...s, done: false })),
                          )
                        }
                      >
                        <Play size={18} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={'删除' + t.name}
                        onClick={() => {
                          if (confirm('删除此训练模板？'))
                            void attempt(() => db.templates.delete(t.id));
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
              ) : (
                <Empty title="喜欢的训练，留给下一次" body="完成运动后，打开记录即可保存为模板。" />
              )}
            </Card>
          </Section>
          <Section title="力量记录">
            <Card>
              {Object.entries(bests).length ? (
                Object.entries(bests)
                  .slice(0, 6)
                  .map(([name, b]) => (
                    <div className="personal-best" key={name}>
                      <span>
                        <strong>{name}</strong>
                        <small>{b.date}</small>
                      </span>
                      <span>
                        {b.weight} kg × {b.reps}
                      </span>
                    </div>
                  ))
              ) : (
                <Empty
                  title="每一点进步，都有记录"
                  body="完成力量训练组后，这里显示每个动作已记录的最大重量与当组次数。"
                />
              )}
            </Card>
          </Section>
          <Section title="运动历史">
            <Card>
              {history.length ? (
                <EntryList entries={history} />
              ) : (
                <Empty
                  icon={<Route size={24} />}
                  title="下一次运动，从这里开始"
                  body="完成的训练与路线会安静地保存在这里。"
                />
              )}
            </Card>
          </Section>
        </div>
      </div>
    </>
  );
}
