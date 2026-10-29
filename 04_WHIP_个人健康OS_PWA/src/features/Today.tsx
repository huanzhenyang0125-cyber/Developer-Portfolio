import { useState } from 'react';
import {
  Flame,
  Droplets,
  Footprints,
  Moon,
  Scale,
  Utensils,
  Heart,
  ShieldCheck,
  ChevronRight,
  Plus,
  Clock,
  Leaf,
  Check,
  Activity,
  Pill,
  Camera,
} from 'lucide-react';
import type { Entry, Preferences, Kind } from '../lib/types';
import { totals, fmt, insights, makeEntry, dayKey } from '../lib/domain';
import { useUI, attempt } from '../lib/store';
import { repository } from '../lib/db';
import { Card, Section, Empty, Metric, Progress, number } from '../components/ui';
import { strings } from '../lib/i18n';
import { WaterDisc } from '../components/WaterDisc';
import { CircleGauge } from 'lucide-react';
import { WeatherCard } from './Weather';
import { ProtocolSummary } from './Protocol';
export const kindInfo: Record<Kind, { label: string; icon: typeof Flame; color: string }> = {
  meal: { label: '饮食', icon: Utensils, color: 'peach' },
  water: { label: '饮水', icon: Droplets, color: 'blue' },
  workout: { label: '运动', icon: Footprints, color: 'mint' },
  body: { label: '身体', icon: Scale, color: 'blue' },
  sleep: { label: '睡眠', icon: Moon, color: 'lilac' },
  mood: { label: '状态', icon: Heart, color: 'peach' },
  supplement: { label: '补剂', icon: Pill, color: 'lilac' },
  habit: { label: '习惯', icon: Check, color: 'mint' },
  photo: { label: '照片', icon: Camera, color: 'blue' },
  protocol: { label: '自律记录', icon: ShieldCheck, color: 'blue' },
};
export function EntryList({ entries, limit }: { entries: Entry[]; limit?: number }) {
  const { open, setTab } = useUI();
  const [page, setPage] = useState(0);
  const size = limit ?? 50;
  const current = Math.min(page, Math.max(0, Math.ceil(entries.length / size) - 1));
  return (
    <div className="entry-list">
      {entries.slice(current * size, (current + 1) * size).map((e) => {
        const { icon: Icon, color } = kindInfo[e.kind];
        return (
          <button
            className="entry-row"
            key={e.id}
            onClick={() =>
              e.kind === 'workout' && e.status !== 'done' ? setTab('activity') : open(e.kind, e)
            }
          >
            <span className={'icon-box ' + color}>
              <Icon size={19} />
            </span>
            <span className="entry-main">
              <strong>{e.name}</strong>
              <small>
                {e.date} ·{' '}
                {new Date(e.occurredAt ?? e.createdAt).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {e.meal ? ' · ' + e.meal : ''}
                {e.quality === 'estimate' ? ' · 估算' : ''}
              </small>
            </span>
            <span className="entry-value">
              {e.kind === 'protocol'
                ? e.eventType === 'resisted'
                  ? '已抵抗'
                  : e.sugarGrams == null
                    ? '已记录'
                    : `${fmt(e.sugarGrams, 1)} g 糖`
                : e.kind === 'meal'
                  ? `${fmt(e.nutrients?.calories ?? 0)} kcal`
                  : e.kind === 'workout'
                    ? `${fmt((e.duration ?? 0) / 60)} 分钟`
                    : e.kind === 'sleep'
                      ? `${fmt(e.duration ?? 0, 1)} 小时`
                      : e.kind === 'habit'
                        ? '已完成'
                        : e.kind === 'photo'
                          ? '查看'
                          : `${e.amount ?? ''} ${e.unit ?? ''}`}
              <ChevronRight size={14} />
            </span>
          </button>
        );
      })}
      {!limit && entries.length > size && (
        <div className="list-pagination">
          <button
            className="text-button"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            上一页
          </button>
          <small>
            {current + 1} / {Math.ceil(entries.length / size)}
          </small>
          <button
            className="text-button"
            disabled={(current + 1) * size >= entries.length}
            onClick={() => setPage(current + 1)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
export function Today({ entries, profile }: { entries: Entry[]; profile: Preferences }) {
  const { day, open, setTab } = useUI();
  const t = strings[profile.language];
  const daily = entries.filter((e) => e.date === day);
  const n = totals(daily);
  const meals = daily.filter((e) => e.kind === 'meal');
  const water = daily.filter((e) => e.kind === 'water').reduce((s, e) => s + (e.amount ?? 0), 0);
  const workouts = daily.filter((e) => e.kind === 'workout' && e.status === 'done');
  const sleep = daily.find((e) => e.kind === 'sleep');
  const body = [...entries]
    .filter((e) => e.kind === 'body' && e.date <= day)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const observation = insights(entries, day, profile);
  return (
    <>
      <div className="dashboard-grid today-bento">
        <Card className="energy-card">
          <div className="card-title">
            <span className="icon-box peach">
              <Flame size={19} />
            </span>
            <h2>{t.food}</h2>
            <span className="tag">
              {meals.length ? '已记录 ' + meals.length + ' 项' : '等待第一条记录'}
            </span>
          </div>
          <div className="energy-content">
            <div className="energy-copy">
              <span className="muted">今日已摄入</span>
              <div className="big-number">
                {meals.length ? fmt(n.calories) : '—'}
                <span>kcal</span>
              </div>
              <p>
                每日目标 <strong>{fmt(profile.calories)}</strong> kcal
              </p>
              <button className="button primary" onClick={() => open('dishes')}>
                <Plus size={18} />
                记录一餐
              </button>
            </div>
            <div
              className="energy-ring"
              aria-label={`已记录 ${fmt(n.calories)} 千卡，目标 ${profile.calories} 千卡`}
            >
              <svg viewBox="0 0 160 160">
                <circle className="ring-track" cx="80" cy="80" r="68" />
                <circle
                  className="ring-value"
                  cx="80"
                  cy="80"
                  r="68"
                  strokeDasharray={`${Math.min(1, n.calories / profile.calories) * 427.26} 427.26`}
                />
              </svg>
              <div>
                <Leaf size={26} />
                <strong>
                  {meals.length
                    ? Math.round((n.calories / profile.calories) * 100) + '%'
                    : '慢慢来'}
                </strong>
                <small>{meals.length ? '目标进度' : '照顾好每一餐'}</small>
              </div>
            </div>
          </div>
          <div className="macro-grid">
            {(
              [
                ['蛋白质', n.protein, profile.protein, 'var(--mint)'],
                ['碳水', n.carbs, profile.carbs, 'var(--blue)'],
                ['脂肪', n.fat, profile.fat, 'var(--peach)'],
              ] as const
            ).map(([label, value, target, color]) => (
              <div key={label}>
                <div>
                  <span className="muted">{label}</span>
                  <strong>
                    {number(value, 1)}
                    <small> / {target} g</small>
                  </strong>
                </div>
                <Progress value={value ?? 0} target={target} color={color} label={label} />
              </div>
            ))}
          </div>
          <p className="footnote">仅汇总已记录食物。运动消耗不会自动加入饮食额度。</p>
        </Card>
        <WeatherCard profile={profile} />
        <Card className="water-card">
          <div className="card-title">
            <span className="icon-box blue">
              <CircleGauge size={19} />
            </span>
            <h2>饮水圆盘</h2>
          </div>
          <div className="water-value">
            {water ? fmt(water) : '—'}
            <small> / {fmt(profile.water)} ml</small>
          </div>
          <WaterDisc amount={water} target={profile.water} />
          <p className="muted text-sm">
            总液体含茶与咖啡 · 白水{' '}
            {fmt(
              daily
                .filter((e) => e.kind === 'water' && (e.category === 'water' || e.name === '白水'))
                .reduce((s, e) => s + (e.amount ?? 0), 0),
            )}{' '}
            ml
          </p>
          <div className="water-actions">
            {profile.waterShortcuts.slice(0, 3).map((amount) => (
              <button
                key={amount}
                onClick={() =>
                  attempt(
                    () =>
                      repository.save({
                        ...makeEntry('water', '白水', day),
                        amount,
                        unit: 'ml',
                        category: 'water',
                      }),
                    `已记录 ${amount} ml 饮水`,
                  )
                }
              >
                +{amount}
                <small> ml</small>
              </button>
            ))}
          </div>
          <button className="text-button" onClick={() => open('water')}>
            自定义饮水量
            <ChevronRight size={14} />
          </button>
        </Card>
      </div>
      <ProtocolSummary entries={entries} />
      <Section title="生活的几个片段">
        <div className="metrics-grid">
          <Metric
            label="活动时间"
            value={
              workouts.length ? fmt(workouts.reduce((s, e) => s + (e.duration ?? 0), 0) / 60) : '—'
            }
            unit="分钟"
            icon={<Footprints size={20} />}
            sub={workouts.length ? `${workouts.length} 次已记录运动` : '动一动，从喜欢的开始'}
            onClick={() => setTab('activity')}
          />
          <Metric
            label="昨夜睡眠"
            value={sleep ? fmt(sleep.duration ?? 0, 1) : '—'}
            unit="小时"
            icon={<Moon size={20} />}
            color="lilac"
            sub={`你的目标 ${profile.sleep} 小时`}
            onClick={() => open('sleep')}
          />
          <Metric
            label="身体记录"
            value={
              body ? fmt((body.amount ?? 0) * (profile.units === 'imperial' ? 2.20462 : 1), 1) : '—'
            }
            unit={profile.units === 'imperial' ? 'lb' : 'kg'}
            icon={<Scale size={20} />}
            color="blue"
            sub={body ? '最近记录于 ' + body.date : '关注变化，不只关注数字'}
            onClick={() => open('body')}
          />
          <Metric
            label="此刻状态"
            value={daily.find((e) => e.kind === 'mood')?.name ?? '怎么样？'}
            unit=""
            icon={<Heart size={20} />}
            color="peach"
            sub="留一点时间，听听自己"
            onClick={() => open('mood')}
          />
        </div>
      </Section>
      <div className="lower-grid">
        <Section title={t.timeline} action="添加记录" onClick={() => open('quick')}>
          <Card>
            {daily.length ? (
              <EntryList
                entries={[...daily].sort((a, b) =>
                  (b.occurredAt ?? b.createdAt).localeCompare(a.occurredAt ?? a.createdAt),
                )}
                limit={20}
              />
            ) : (
              <Empty
                icon={<Clock size={27} />}
                title="今天的故事，等你记录"
                body="一餐饭、一杯水、一场散步。每一个小小的行动，都值得被看见。"
                action="添加第一条记录"
                onClick={() => open('quick')}
              />
            )}
          </Card>
        </Section>
        <Section title="属于你的观察">
          <div className="insights">
            {observation.map((o) => (
              <Card className="insight" key={o.id}>
                <div className="flex justify-between items-center">
                  <span className="tag">
                    <Activity size={13} />
                    {o.type}
                  </span>
                  {o.id !== 'start' && (
                    <button
                      className="text-button"
                      onClick={() =>
                        attempt(() =>
                          repository.profile({
                            ...profile,
                            dismissed: [...profile.dismissed, o.id],
                          }),
                        )
                      }
                    >
                      收起
                    </button>
                  )}
                </div>
                <h3>{o.title}</h3>
                <p>{o.body}</p>
              </Card>
            ))}
            <div className="privacy-note">
              <ShieldCheck size={15} />
              <span>你的数据，只属于你。{day === dayKey() ? '今天也照顾好自己。' : ''}</span>
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}
