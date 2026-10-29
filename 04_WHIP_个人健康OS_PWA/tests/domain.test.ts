import { describe, it, expect } from 'vitest';
import {
  scale,
  totals,
  makeEntry,
  elapsed,
  distance,
  validPoint,
  routeDistance,
  sleepHours,
  average,
  movingAverage,
  percentChange,
  dayKey,
  shiftDay,
  insights,
  csv,
  validateBackup,
  volume,
} from '../src/lib/domain';
import { defaults } from '../src/lib/types';
import type { RoutePoint, Backup } from '../src/lib/types';
import { starterFoods, exercises } from '../src/lib/catalog';
const n = { calories: 130, protein: 2.69, carbs: 28.17, fat: 0.28, sodium: null };
const meal = (amount = 100) => ({
  ...makeEntry('meal', '米饭', '2026-10-22'),
  amount,
  nutrients: scale(n, amount),
});
const point = (lat = 0, lng = 0, time = 1000, segment = 0): RoutePoint => ({
  lat,
  lng,
  time,
  segment,
  accuracy: 5,
});
const backup = (): Backup => ({
  app: 'VITAL',
  version: 1,
  exportedAt: new Date().toISOString(),
  entries: [meal()],
  foods: starterFoods,
  templates: [],
  profile: defaults,
});
describe('营养与缺失值', () => {
  it('按克数缩放全部营养', () => {
    expect(scale(n, 150).calories).toBe(195);
    expect(scale(n, 50).carbs).toBeCloseTo(14.085);
  });
  it('保留缺失值', () => {
    expect(scale(n, 50).sodium).toBeNull();
    expect(totals([meal(), meal()]).sodium).toBeNull();
  });
  it('未知宏量不混为零或部分精确总数', () => {
    expect(totals([meal(), { ...meal(), nutrients: { ...n, protein: null } }]).protein).toBeNull();
  });
  it('每日总量排除饮水和其他日期由查询方筛选', () => {
    expect(totals([meal(100), meal(200), makeEntry('water', '白水')]).calories).toBe(390);
  });
  it('无记录热量计数为0，但宏量为未知', () => {
    expect(totals([]).calories).toBe(0);
    expect(totals([]).protein).toBeNull();
  });
  it('拒绝无效份量', () => {
    for (const v of [-1, 0, NaN, Infinity, 100001]) expect(() => scale(n, v)).toThrow();
  });
  it('食谱按成品重量和份数分配', () => {
    const recipe = totals([meal(100), meal(200)]);
    expect(scale(recipe, 10000 / 600).calories).toBeCloseTo(65);
    expect(scale(scale(recipe, 10000 / 600), 300).calories).toBeCloseTo(195);
  });
  it('运动不会改变已吃热量', () =>
    expect(totals([meal(), { ...makeEntry('workout', '跑步'), duration: 3600 }]).calories).toBe(
      130,
    ));
  it('目录有独立来源和稳定 ID', () => {
    expect(new Set(starterFoods.map((f) => f.id)).size).toBe(starterFoods.length);
    expect(starterFoods.every((f) => f.source && f.sourceId)).toBe(true);
  });
});
describe('运动与 GPS', () => {
  it('使用时间戳计算时长和暂停', () => {
    const e = {
      ...makeEntry('workout', '跑步'),
      start: 1000,
      pausedMs: 2000,
      status: 'active' as const,
    };
    expect(elapsed(e, 11000)).toBe(8);
    expect(elapsed({ ...e, status: 'paused', pausedAt: 6000 }, 21000)).toBe(3);
  });
  it('完成后时长稳定', () =>
    expect(
      elapsed({ ...makeEntry('workout', '卧推'), status: 'done', duration: 900 }, 999999),
    ).toBe(900));
  it('训练量仅统计已完成组', () =>
    expect(
      volume([
        { weight: 30, reps: 12, done: true },
        { weight: 35, reps: 10, done: true },
        { weight: 35, reps: 8, done: true },
        { weight: 90, reps: 1, done: false },
      ]),
    ).toBe(990));
  it('Haversine 一度纬度约111.2km', () =>
    expect(distance(point(), point(1))).toBeCloseTo(111194.927, 0));
  it('过滤 GPS 跳点、精度差、倒退时间', () => {
    expect(validPoint(point(1, 0, 2000), point())).toBe(false);
    expect(validPoint({ ...point(), accuracy: 100 }, undefined)).toBe(false);
    expect(validPoint(point(0, 0.0001, 1000), point())).toBe(false);
  });
  it('接收合理运动点', () => expect(validPoint(point(0, 0.0001, 5000), point())).toBe(true));
  it('暂停区间不连接路线', () => expect(routeDistance([point(), point(1, 0, 2000, 1)])).toBe(0));
  it('运动资料至少100条且无重名', () => {
    expect(exercises.length).toBeGreaterThanOrEqual(100);
    expect(new Set(exercises.map((e) => e.name)).size).toBe(exercises.length);
  });
});
describe('日期与趋势', () => {
  it('跨午夜睡眠', () => expect(sleepHours('2026-10-21T23:30', '2026-10-22T07:00')).toBe(7.5));
  it('拒绝负数及过长睡眠', () => {
    expect(() => sleepHours('2026-10-22T08:00', '2026-10-22T07:00')).toThrow();
    expect(() => sleepHours('2026-10-20T08:00', '2026-10-22T07:00')).toThrow();
  });
  it('跨月和跨年边界', () => {
    expect(shiftDay('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftDay('2024-02-28', 1)).toBe('2024-02-29');
  });
  it('本地日期不误用 UTC', () => expect(dayKey(new Date(2026, 9, 22, 0, 15))).toBe('2026-10-22'));
  it('缺失值不计为零', () => {
    expect(average([null, 10, 20])).toBe(15);
    expect(average([null])).toBeNull();
    expect(movingAverage([1, null, 3], 2)).toEqual([1, 1, 3]);
  });
  it('无效百分比分母不计算', () => {
    expect(percentChange(10, 0)).toBeNull();
    expect(percentChange(15, 10)).toBe(50);
  });
  it('洞察只基于真实记录和覆盖率', () => {
    const entries = [{ ...makeEntry('sleep', '睡眠', '2026-10-22'), duration: 8 }];
    const result = insights(entries, '2026-10-22', defaults);
    expect(result[0].body).toContain('1/7');
    expect(result[0].title).toContain('8');
    expect(
      insights(entries, '2026-10-22', { ...defaults, dismissed: [result[0].id] }),
    ).toHaveLength(0);
  });
  it('空数据没有虚假统计', () => expect(insights([], '2026-10-22', defaults)[0].id).toBe('start'));
});
describe('备份安全与导出', () => {
  it('完整格式可往返', () =>
    expect(validateBackup(JSON.parse(JSON.stringify(backup()))).entries).toHaveLength(1));
  it('拒绝其他应用、未知版本及空数据类型', () => {
    expect(() => validateBackup(null)).toThrow();
    expect(() => validateBackup({ ...backup(), version: 2 })).toThrow();
  });
  it('拒绝负份量和非有限营养', () => {
    const b = backup();
    b.entries[0].amount = -1;
    expect(() => validateBackup(b)).toThrow();
    const c = backup();
    c.foods = [{ ...starterFoods[0], nutrients: { ...n, calories: Infinity } }];
    expect(() => validateBackup(c)).toThrow();
  });
  it('拒绝重复标识符', () => {
    const b = backup();
    b.entries.push(b.entries[0]);
    expect(() => validateBackup(b)).toThrow();
  });
  it('拒绝危险照片 URL', () => {
    const b = backup();
    b.entries = [{ ...makeEntry('photo', '照片'), photo: 'https://tracking.example/private.jpg' }];
    expect(() => validateBackup(b)).toThrow();
  });
  it('拒绝无效坐标与训练组', () => {
    const b = backup();
    b.entries = [{ ...makeEntry('workout', '跑步'), route: [point(200)] }];
    expect(() => validateBackup(b)).toThrow();
  });
  it('CSV 正确转义引号、换行与公式', () => {
    const e = { ...meal(), name: '=SUM(1,2)', notes: '含"引号"\n新行' };
    const c = csv([e]);
    expect(c).toContain("'=SUM(1,2)");
    expect(c).toContain('含""引号""\n新行');
    expect(c.startsWith('\uFEFF')).toBe(true);
  });
});
