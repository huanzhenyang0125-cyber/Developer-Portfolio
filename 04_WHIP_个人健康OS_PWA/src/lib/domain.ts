import type { Entry, Nutrients, RoutePoint, Backup, Preferences } from './types';
export const uid = () => crypto.randomUUID();
const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const numberFormatters = new Map<number, Intl.NumberFormat>();
export function dayKey(date: Date | string = new Date()) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function shiftDay(day: string, delta: number) {
  const d = new Date(day + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  return dayKey(d);
}
export const fmt = (n: number, d = 0) => {
  let formatter = numberFormatters.get(d);
  if (!formatter) {
    formatter = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: d });
    numberFormatters.set(d, formatter);
  }
  return formatter.format(n);
};
export function scale(n: Nutrients, amount: number): Nutrients {
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) throw Error('请输入有效份量');
  return Object.fromEntries(
    Object.entries(n).map(([k, v]) => [k, v == null ? null : (v * amount) / 100]),
  ) as unknown as Nutrients;
}
export function totals(entries: Entry[]): Nutrients {
  const meals = entries.filter((e) => e.kind === 'meal' && e.nutrients);
  const keys = [
    'calories',
    'protein',
    'carbs',
    'fat',
    'fiber',
    'sugar',
    'sodium',
    'saturatedFat',
    'caffeine',
  ];
  return Object.fromEntries(
    keys.map((k) => {
      const vals = meals.map((e) => (e.nutrients as unknown as Record<string, number | null>)[k]);
      return [
        k,
        k === 'calories'
          ? vals.reduce<number>((s, v) => s + (v ?? 0), 0)
          : vals.length && vals.every((v) => v != null)
            ? vals.reduce<number>((s, v) => s + (v ?? 0), 0)
            : null,
      ];
    }),
  ) as unknown as Nutrients;
}
export function elapsed(e: Entry, now = Date.now()) {
  if (e.status === 'done') return e.duration ?? 0;
  return Math.max(0, ((e.pausedAt ?? now) - (e.start ?? now) - (e.pausedMs ?? 0)) / 1000);
}
export const volume = (sets: SetRecordLike[] = []) =>
  sets.filter((s) => s.done).reduce((n, s) => n + s.weight * s.reps, 0);
type SetRecordLike = { done: boolean; weight: number; reps: number };
export function distance(a: RoutePoint, b: RoutePoint) {
  const rad = (v: number) => (v * Math.PI) / 180;
  const p =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(Math.min(1, p)), Math.sqrt(Math.max(0, 1 - p)));
}
export function validPoint(point: RoutePoint, last: RoutePoint | undefined, activity = '跑步') {
  if (
    !Number.isFinite(point.lng) ||
    !Number.isFinite(point.time) ||
    !Number.isFinite(point.accuracy) ||
    !Number.isFinite(point.lat) ||
    Math.abs(point.lat) > 90 ||
    Math.abs(point.lng) > 180 ||
    point.accuracy > 40 ||
    point.accuracy < 0
  )
    return false;
  if (!last || point.segment !== last.segment) return true;
  const seconds = (point.time - last.time) / 1000;
  if (seconds <= 0) return false;
  const meters = distance(last, point);
  return (
    meters / seconds < (/骑行/.test(activity) ? 25 : 10) &&
    meters >= Math.max(3, Math.min(point.accuracy, last.accuracy) * 0.3)
  );
}
export const routeDistance = (route: RoutePoint[]) =>
  route
    .slice(1)
    .reduce((sum, p, i) => sum + (p.segment === route[i].segment ? distance(route[i], p) : 0), 0);
export function sleepHours(start: string, end: string) {
  const h = (new Date(end).getTime() - new Date(start).getTime()) / 3600000;
  if (!Number.isFinite(h) || h <= 0 || h > 24)
    throw Error('睡眠结束时间需晚于开始时间，且不超过 24 小时');
  return h;
}
export function average(values: (number | null | undefined)[]) {
  const v = values.filter((x): x is number => x != null && Number.isFinite(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}
export function movingAverage(values: (number | null)[], window = 7) {
  return values.map((_, i) => average(values.slice(Math.max(0, i - window + 1), i + 1)));
}
export const percentChange = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : null);
export function insights(entries: Entry[], day: string, p: Preferences) {
  const start = shiftDay(day, -6),
    prior = shiftDay(day, -13);
  const current = entries.filter((e) => e.date >= start && e.date <= day);
  const previous = entries.filter((e) => e.date >= prior && e.date < start);
  const messages: { id: string; title: string; body: string; type: string }[] = [];
  const sleep = current.filter((e) => e.kind === 'sleep');
  const priorSleep = previous.filter((e) => e.kind === 'sleep');
  if (sleep.length) {
    const a = average(sleep.map((e) => e.duration))!;
    const b = average(priorSleep.map((e) => e.duration));
    messages.push({
      id: 'sleep-' + day,
      title: `已记录的睡眠平均 ${fmt(a, 1)} 小时`,
      body: `${start} 至 ${day}，覆盖 ${new Set(sleep.map((e) => e.date)).size}/7 天。${b != null ? `较前一周${a >= b ? '增加' : '减少'} ${fmt(Math.abs(a - b) * 60)} 分钟（前期 ${priorSleep.length} 条）。` : '前一周记录不足，暂不比较。'}`,
      type: '记录比较',
    });
  }
  const w = current.filter((e) => e.kind === 'workout' && e.status === 'done');
  if (w.length)
    messages.push({
      id: 'workout-' + day,
      title: `这周，为自己动了 ${w.length} 次`,
      body: `${start} 至 ${day}，已记录 ${fmt(w.reduce((n, e) => n + (e.duration ?? 0), 0) / 60)} 分钟运动。你的每周目标为 ${p.workouts} 次。`,
      type: '记录事实',
    });
  if (!messages.length)
    messages.push({
      id: 'start',
      title: '从一条小小的记录开始',
      body: '有了真实记录，这里会逐渐出现关于饮食、运动和睡眠的观察。不评分，也不替你下结论。',
      type: '关于洞察',
    });
  return messages.filter((x) => !p.dismissed.includes(x.id)).slice(0, 2);
}
export const makeEntry = (kind: Entry['kind'], name: string, date = dayKey()): Entry => ({
  id: uid(),
  kind,
  name,
  date,
  notes: '',
  timezone: localTimeZone,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
export function csv(entries: Entry[]) {
  const cols = [
    'id',
    'kind',
    'date',
    'name',
    'amount',
    'unit',
    'duration',
    'distance',
    'calories',
    'protein',
    'carbs',
    'fat',
    'notes',
  ];
  const escape = (v: unknown) =>
    '"' +
    String(v ?? '')
      .replace(/^[=+\-@\t\r]/, "'$&")
      .replace(/"/g, '""') +
    '"';
  return (
    '\uFEFF' +
    [
      cols,
      ...entries.map((e) =>
        cols.map((k) =>
          ['calories', 'protein', 'carbs', 'fat'].includes(k)
            ? e.nutrients?.[k as keyof Nutrients]
            : e[k as keyof Entry],
        ),
      ),
    ]
      .map((r) => r.map(escape).join(','))
      .join('\r\n')
  );
}
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const finite = (v: unknown, min = 0, max = 1e9) =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
export function validateBackup(raw: unknown): Backup {
  if (
    !record(raw) ||
    !['VITAL', 'WHIP'].includes(String(raw.app)) ||
    raw.version !== 1 ||
    !Number.isFinite(Date.parse(String(raw.exportedAt))) ||
    !Array.isArray(raw.entries) ||
    !Array.isArray(raw.foods) ||
    !Array.isArray(raw.templates) ||
    !record(raw.profile)
  )
    throw Error('这不是受支持的 WHIP / VITAL v1 备份');
  if (raw.entries.length > 100000 || raw.foods.length > 10000 || raw.templates.length > 1000)
    throw Error('备份记录数量超出限制');
  const kinds = [
    'meal',
    'water',
    'workout',
    'body',
    'sleep',
    'mood',
    'supplement',
    'habit',
    'photo',
    'protocol',
  ];
  const nutrients = (n: unknown) =>
    record(n) &&
    finite(n.calories) &&
    ['protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium', 'saturatedFat', 'caffeine'].every(
      (k) => n[k] == null || finite(n[k]),
    );
  function checkEntry(e: unknown): boolean {
    if (
      !record(e) ||
      typeof e.id !== 'string' ||
      e.id.length > 100 ||
      !kinds.includes(String(e.kind)) ||
      typeof e.date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(e.date) ||
      dayKey(e.date + 'T12:00:00') !== e.date ||
      typeof e.name !== 'string' ||
      e.name.length > 500 ||
      typeof e.notes !== 'string' ||
      !Number.isFinite(Date.parse(String(e.createdAt))) ||
      !Number.isFinite(Date.parse(String(e.updatedAt)))
    )
      return false;
    if (
      [
        'amount',
        'duration',
        'distance',
        'start',
        'end',
        'pausedAt',
        'pausedMs',
        'energy',
        'waist',
        'bodyFat',
        'rpe',
        'estimatedCalories',
      ].some((k) => e[k] != null && !finite(e[k]))
    )
      return false;
    if (
      e.kind === 'protocol' &&
      (!['masturbation', 'sugary-drink', 'resisted'].includes(String(e.eventType)) ||
        typeof e.occurredAt !== 'string' ||
        !Number.isFinite(Date.parse(e.occurredAt)))
    )
      return false;
    if (['sugarGrams', 'sugarPer100'].some((k) => e[k] != null && !finite(e[k], 0, 10000)))
      return false;
    if (
      e.recoveryAt != null &&
      (typeof e.recoveryAt !== 'string' || !Number.isFinite(Date.parse(e.recoveryAt)))
    )
      return false;
    if (e.sugarSource != null && (typeof e.sugarSource !== 'string' || e.sugarSource.length > 500))
      return false;
    if (e.kind === 'meal' && (!nutrients(e.nutrients) || !finite(e.amount, 0.01, 100000)))
      return false;
    if (e.kind === 'water' && !finite(e.amount, 1, 10000)) return false;
    if (e.kind === 'body' && !finite(e.amount, 1, 700)) return false;
    if (e.kind === 'sleep' && !finite(e.duration, 0.01, 24)) return false;
    if (e.kind === 'mood' && !finite(e.amount, 1, 5)) return false;
    if (e.status != null && !['done', 'paused', 'active'].includes(String(e.status))) return false;
    if (
      e.photo != null &&
      (typeof e.photo !== 'string' ||
        !/^data:image\/(jpeg|png|webp);base64,/.test(e.photo) ||
        e.photo.length > 10000000)
    )
      return false;
    if (
      e.sets != null &&
      (!Array.isArray(e.sets) ||
        e.sets.length > 1000 ||
        !e.sets.every(
          (s) =>
            record(s) &&
            typeof s.exercise === 'string' &&
            finite(s.weight, 0, 1000) &&
            finite(s.reps, 1, 1000) &&
            typeof s.done === 'boolean' &&
            finite(s.rest, 0, 3600),
        ))
    )
      return false;
    if (
      e.route != null &&
      (!Array.isArray(e.route) ||
        e.route.length > 200000 ||
        !e.route.every(
          (p) =>
            record(p) &&
            finite(p.lat, -90, 90) &&
            finite(p.lng, -180, 180) &&
            finite(p.time) &&
            finite(p.accuracy) &&
            finite(p.segment),
        ))
    )
      return false;
    return true;
  }
  if (!raw.entries.every(checkEntry)) throw Error('备份中有无效的健康记录，未导入任何数据');
  if (
    !raw.foods.every(
      (f) =>
        record(f) &&
        typeof f.id === 'string' &&
        typeof f.name === 'string' &&
        typeof f.english === 'string' &&
        typeof f.aliases === 'string' &&
        typeof f.source === 'string' &&
        typeof f.sourceId === 'string' &&
        ['g', 'ml'].includes(String(f.basis)) &&
        ['reference', 'estimate', 'label', 'user'].includes(String(f.quality)) &&
        nutrients(f.nutrients) &&
        Array.isArray(f.servings) &&
        f.servings.every(
          (s) => record(s) && typeof s.name === 'string' && finite(s.amount, 0.01, 100000),
        ),
    )
  )
    throw Error('食物数据格式或营养值无效');
  if (
    !raw.templates.every(
      (t) =>
        record(t) &&
        typeof t.id === 'string' &&
        typeof t.name === 'string' &&
        ['meal', 'workout'].includes(String(t.kind)) &&
        Array.isArray(t.entries) &&
        t.entries.every((e) => checkEntry(e) && record(e) && e.kind === t.kind),
    )
  )
    throw Error('模板格式无效');
  const p = raw.profile;
  if (['vibration', 'alertSound'].some((k) => p[k] !== undefined && typeof p[k] !== 'boolean'))
    throw Error('提醒偏好无效');
  if (
    p.avatar !== undefined &&
    (typeof p.avatar !== 'string' ||
      p.avatar.length > 500000 ||
      !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p.avatar))
  )
    throw Error('头像格式无效');
  if (
    p.avatarStyle !== undefined &&
    !['initials', 'orbit', 'mountain', 'wave', 'court'].includes(String(p.avatarStyle))
  )
    throw Error('头像样式无效');
  if (p.weatherLocation !== undefined) {
    const w = p.weatherLocation;
    if (
      !record(w) ||
      typeof w.name !== 'string' ||
      !w.name ||
      w.name.length > 150 ||
      !finite(w.latitude, -90, 90) ||
      !finite(w.longitude, -180, 180) ||
      (w.country !== undefined && typeof w.country !== 'string')
    )
      throw Error('天气城市格式无效');
  }

  if (
    p.id !== 'profile' ||
    typeof p.name !== 'string' ||
    ![
      'calories',
      'protein',
      'carbs',
      'fat',
      'water',
      'sleep',
      'workouts',
      'weightGoal',
      'height',
    ].every((k) => finite(p[k], 0.1, 100000)) ||
    !['system', 'dark', 'light'].includes(String(p.theme)) ||
    !['metric', 'imperial'].includes(String(p.units)) ||
    !['zh-CN', 'en'].includes(String(p.language)) ||
    typeof p.onboarded !== 'boolean' ||
    !Array.isArray(p.dismissed) ||
    !p.dismissed.every((x) => typeof x === 'string') ||
    !Array.isArray(p.habits) ||
    !p.habits.every((x) => typeof x === 'string') ||
    !Array.isArray(p.waterShortcuts) ||
    !p.waterShortcuts.every((x) => finite(x, 1, 10000))
  )
    throw Error('个人目标或偏好格式无效');
  for (const list of [raw.entries, raw.foods, raw.templates])
    if (new Set(list.map((x) => (x as { id: string }).id)).size !== list.length)
      throw Error('备份包含重复标识符');
  return raw as unknown as Backup;
}
