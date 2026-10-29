import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartNoAxesCombined, Calendar, TrendingUp, Database } from 'lucide-react';
import type { Entry, Preferences } from '../lib/types';
import {
  dayKey,
  shiftDay,
  totals,
  average,
  fmt,
  percentChange,
  volume,
  movingAverage,
} from '../lib/domain';
import { Card, Section, Empty } from '../components/ui';
import { EntryList } from './Today';
import { useUI } from '../lib/store';
const dimensions = {
  calories: ['饮食能量', 'kcal', 'meal'],
  protein: ['蛋白质', 'g', 'meal'],
  carbs: ['碳水化合物', 'g', 'meal'],
  fat: ['脂肪', 'g', 'meal'],
  water: ['饮水', 'ml', 'water'],
  duration: ['运动时间', '分钟', 'workout'],
  frequency: ['运动次数', '次', 'workout'],
  distance: ['运动距离', 'km', 'workout'],
  volume: ['训练量', 'kg', 'workout'],
  estimatedCalories: ['活动能量估算', 'kcal', 'workout'],
  body: ['体重', 'kg', 'body'],
  waist: ['腰围', 'cm', 'body'],
  bodyFat: ['体脂率', '%', 'body'],
  sleep: ['睡眠时间', '小时', 'sleep'],
  mood: ['心情', '/ 5', 'mood'],
  energy: ['精力', '/ 5', 'mood'],
  habit: ['习惯完成', '次', 'habit'],
} as const;
type Dimension = keyof typeof dimensions;
export function Trends({ entries, profile }: { entries: Entry[]; profile: Preferences }) {
  const [range, setRange] = useState('7'),
    [metric, setMetric] = useState<Dimension>('calories'),
    [end, setEnd] = useState(dayKey()),
    [start, setStart] = useState(shiftDay(dayKey(), -6));
  const { open } = useUI();
  const from = range === 'custom' ? start : shiftDay(end, -Number(range) + 1);
  const days = Math.min(
    3660,
    Math.max(
      0,
      Math.round(
        (new Date(end + 'T12:00:00').getTime() - new Date(from + 'T12:00:00').getTime()) / 86400000,
      ) + 1,
    ),
  );
  const [label, defaultUnit, kind] = dimensions[metric];
  const unit = profile.units === 'imperial' && metric === 'body' ? 'lb' : defaultUnit;
  const data = useMemo(() => {
    const result = [];
    for (let i = 0; i < days; i++) {
      const date = shiftDay(from, i);
      const rows = entries.filter(
        (e) => e.date === date && e.kind === kind && (kind !== 'workout' || e.status === 'done'),
      );
      let value: number | null = null;
      if (rows.length) {
        if (['calories', 'protein', 'carbs', 'fat'].includes(metric))
          value = totals(rows)[metric as 'calories' | 'protein' | 'carbs' | 'fat'];
        else if (metric === 'water') value = rows.reduce((s, e) => s + (e.amount ?? 0), 0);
        else if (metric === 'duration')
          value = rows.reduce((s, e) => s + (e.duration ?? 0) / 60, 0);
        else if (metric === 'distance')
          value = rows.reduce((s, e) => s + (e.distance ?? 0) / 1000, 0);
        else if (metric === 'frequency' || metric === 'habit') value = rows.length;
        else if (metric === 'volume') value = rows.reduce((s, e) => s + volume(e.sets), 0);
        else if (metric === 'estimatedCalories')
          value = rows.every((e) => e.estimatedCalories != null)
            ? rows.reduce((s, e) => s + e.estimatedCalories!, 0)
            : null;
        else if (metric === 'sleep') value = average(rows.map((e) => e.duration));
        else if (metric === 'waist' || metric === 'bodyFat' || metric === 'energy')
          value = average(rows.map((e) => e[metric]));
        else value = average(rows.map((e) => e.amount));
        if (metric === 'body' && profile.units === 'imperial' && value != null) value *= 2.20462;
      }
      result.push({ date, label: date.slice(5).replace('-', '/'), value });
    }
    const ma = movingAverage(result.map((r) => r.value));
    return result.map((r, i) => ({ ...r, average: r.value == null ? null : ma[i] }));
  }, [entries, from, end, metric, profile.units]);
  const values = data.map((d) => d.value).filter((x): x is number => x != null);
  const mean = average(values);
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted.length
    ? (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.ceil((sorted.length - 1) / 2)]) / 2
    : null;
  const rows = entries.filter((e) => e.date >= from && e.date <= end && e.kind === kind);
  const half = Math.floor(data.length / 2);
  const first = average(data.slice(0, half).map((x) => x.value));
  const last = average(data.slice(half).map((x) => x.value));
  const change = first != null && last != null ? percentChange(last, first) : null;
  return (
    <>
      <div className="page-intro">
        <span className="page-symbol blue">
          <ChartNoAxesCombined size={24} />
        </span>
        <div>
          <h2>看见变化，理解自己。</h2>
          <p>从真实记录里发现趋势，让每一步都有迹可循。</p>
        </div>
      </div>
      <div className="trend-controls">
        <div className="segmented">
          {[
            ['7', '7 天'],
            ['30', '30 天'],
            ['90', '90 天'],
            ['custom', '自定义'],
          ].map(([v, l]) => (
            <button className={range === v ? 'selected' : ''} key={v} onClick={() => setRange(v)}>
              {l}
            </button>
          ))}
        </div>
        <div className="date-inputs">
          {range === 'custom' && (
            <input
              aria-label="开始日期"
              type="date"
              value={start}
              max={end}
              onChange={(e) => setStart(e.target.value)}
            />
          )}
          <input
            aria-label="结束日期"
            type="date"
            value={end}
            min={range === 'custom' ? start : undefined}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      </div>
      <div className="pills trend-pills">
        {Object.entries(dimensions).map(([k, [l]]) => (
          <button
            key={k}
            className={metric === k ? 'selected' : ''}
            onClick={() => setMetric(k as Dimension)}
          >
            {l}
          </button>
        ))}
      </div>
      <Card className="chart-card">
        <div className="section-heading">
          <div>
            <span className="muted text-sm">
              {label} · {from} — {end}
            </span>
            <div className="chart-headline">
              {mean == null ? '等待记录' : fmt(mean, 1)}
              <small>{unit} / 已记录日均值</small>
            </div>
          </div>
          <span className="tag">
            <Database size={13} />
            {values.length} / {days} 天有记录
          </span>
        </div>
        {values.length ? (
          <>
            <div
              className="chart-wrap"
              role="img"
              aria-label={`${label}从 ${from} 到 ${end}，有记录 ${values.length} 天，均值 ${fmt(mean!, 1)} ${unit}。空缺日期未计为零。`}
            >
              <ResponsiveContainer width="100%" height={285}>
                <AreaChart data={data} margin={{ top: 20, right: 12, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0071e3" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#0071e3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--line)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'var(--muted)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={32}
                  />
                  <YAxis
                    domain={
                      ['body', 'waist', 'bodyFat'].includes(metric)
                        ? ['auto', 'auto']
                        : ['mood', 'energy'].includes(metric)
                          ? [1, 5]
                          : [0, 'auto']
                    }
                    tick={{ fill: 'var(--muted)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={55}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--floating-surface)',
                      backdropFilter: 'blur(24px)',
                      boxShadow: 'var(--shadow-floating)',
                      border: '1px solid var(--line)',
                      borderRadius: 12,
                      color: 'var(--text)',
                    }}
                    formatter={(v, name) => [
                      v == null ? '未记录' : fmt(Number(v), 1) + ' ' + unit,
                      name,
                    ]}
                  />
                  <Area
                    name={label}
                    type="linear"
                    dataKey="value"
                    stroke="var(--mint)"
                    fill="url(#area-fill)"
                    strokeWidth={2.5}
                    connectNulls={false}
                    dot={{ r: 3 }}
                    isAnimationActive={
                      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
                    }
                    animationDuration={600}
                  />
                  <Area
                    name="7 日移动平均"
                    type="linear"
                    dataKey="average"
                    stroke="var(--chart-secondary)"
                    fill="transparent"
                    strokeDasharray="4 5"
                    strokeWidth={1.5}
                    connectNulls={false}
                    isAnimationActive={
                      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
                    }
                    animationDuration={600}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-legend">
              <span>
                <i />
                每日记录
              </span>
              <span>
                <i className="blue-dot" />7 日移动平均
              </span>
            </div>
          </>
        ) : (
          <Empty
            icon={<ChartNoAxesCombined size={34} />}
            title="趋势，始于日积月累"
            body="当前范围内还没有这类记录。空白不是零，只是等待你留下生活的印记。"
            action="记录一点今天"
            onClick={() => open(kind as Entry['kind'])}
          />
        )}
        <p className="footnote">
          只统计有记录的日期，不代表完整日摄入或全天活动。移动平均使用最近 7
          个日历日的已知值；缺失日期不连线。
        </p>
      </Card>
      <div className="trend-stat-grid">
        {[
          ['记录均值', mean == null ? '—' : fmt(mean, 1), unit],
          ['中位数', median == null ? '—' : fmt(median, 1), unit],
          ['前后半段变化', change == null ? '—' : (change > 0 ? '+' : '') + fmt(change, 1), '%'],
          ['数据覆盖率', days ? fmt((values.length / days) * 100) : '—', '%'],
        ].map(([l, v, u]) => (
          <Card key={l}>
            <span className="muted text-sm">{l}</span>
            <strong>
              {v}
              <small>{u}</small>
            </strong>
          </Card>
        ))}
      </div>
      <Section title="查看原始记录">
        <Card>
          {rows.length ? (
            <EntryList entries={[...rows].sort((a, b) => b.date.localeCompare(a.date))} />
          ) : (
            <Empty
              title="这里保留每一条依据"
              body="图表与观察都来自你的实际记录。点击已有记录可编辑或删除。"
            />
          )}
        </Card>
      </Section>
    </>
  );
}
