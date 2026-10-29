import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { sugarAmount, sugarCubes, elapsedSince, latestLapse } from '../src/lib/protocol';
import { parseWeather, validWeatherLocation, weatherLabel } from '../src/lib/weather';
import { makeEntry, totals, validateBackup } from '../src/lib/domain';
import { db, initialize, repository } from '../src/lib/db';
import { dishes } from '../src/lib/dishes';
const city = { name: 'Test city', latitude: 3.14, longitude: 101.69 };
beforeEach(async () => {
  await db.entries.clear();
  await db.foods.clear();
  await db.preferences.clear();
  await db.templates.clear();
  await initialize();
});
describe('新增功能与原有计算隔离', () => {
  it('糖与展示方糖按实际容量计算，不作整数方糖假精确', () => {
    expect(sugarAmount(330, 10.6)).toBeCloseTo(34.98);
    expect(sugarCubes(34.98)).toBeCloseTo(8.745);
    expect(sugarAmount(500, 10.6)).toBe(53);
    expect(sugarAmount(330, 0)).toBe(0);
  });
  it('抵抗事件不影响最新重置时间，跨天时间正确', () => {
    const at = '2026-10-20T20:00:00Z';
    const event = {
      ...makeEntry('protocol', '测试'),
      eventType: 'sugary-drink' as const,
      occurredAt: at,
    };
    const resistance = {
      ...makeEntry('protocol', '测试'),
      eventType: 'resisted' as const,
      occurredAt: '2026-10-21T20:00:00Z',
    };
    expect(latestLapse([event, resistance])).toEqual(event);
    expect(latestLapse([])).toBeUndefined();
    expect(elapsedSince(at, Date.parse('2026-10-22T21:03:00Z'))).toBe('2天 1时 3分');
    expect(elapsedSince('invalid')).toBe('—');
  });
  it('事件重复写入相同 ID 仅一条；重启、备份和恢复保留未知糖量', async () => {
    const e = {
      ...makeEntry('protocol', '未知糖量奶茶'),
      eventType: 'sugary-drink' as const,
      occurredAt: new Date().toISOString(),
      amount: 330,
      unit: 'ml',
    };
    await Promise.all([repository.save(e), repository.save(e)]);
    expect(await db.entries.count()).toBe(1);
    await initialize();
    const backup = await repository.export();
    expect(validateBackup(backup).entries[0].sugarGrams).toBeUndefined();
    await db.entries.clear();
    await repository.import(backup, 'replace');
    expect((await db.entries.toArray())[0].eventType).toBe('sugary-drink');
    expect(totals(await db.entries.toArray()).calories).toBe(0);
  });
  it('坏事件和偏好导入会原子拒绝，历史记录不丢失', async () => {
    await repository.save({ ...makeEntry('water', '白水'), amount: 250 });
    const b = await repository.export();
    b.entries.push({
      ...makeEntry('protocol', '坏事件'),
      eventType: 'sugary-drink',
      occurredAt: 'bad',
    });
    await expect(repository.import(b, 'replace')).rejects.toThrow();
    expect(await db.entries.count()).toBe(1);
    const valid = await repository.export();
    (valid.profile as unknown as Record<string, unknown>).vibration = 'yes';
    expect(() => validateBackup(valid)).toThrow();
  });
  it('新头像与天气设置可备份；非法图片或坐标拒绝', async () => {
    const b = await repository.export();
    b.profile = {
      ...b.profile,
      avatarStyle: 'court',
      weatherLocation: { ...city },
      alertSound: false,
      vibration: false,
    };
    expect(validateBackup(b).profile.avatarStyle).toBe('court');
    b.profile.weatherLocation!.latitude = 200;
    expect(() => validateBackup(b)).toThrow();
    delete b.profile.weatherLocation;
    b.profile.avatar = 'https://tracking.example/image.png';
    expect(() => validateBackup(b)).toThrow();
  });
  it('菜品有具体数据来源，火锅未知营养不伪造为零', () => {
    expect(dishes.find((d) => d.name === '火锅')?.food).toBeUndefined();
    for (const d of dishes.filter((d) => d.food)) {
      expect(d.food!.sourceURL).toMatch(/^https:/);
      expect(d.food!.nutrients.calories).toBeGreaterThan(0);
    }
    expect(dishes.find((d) => d.name === '炒粿条')!.food!.nutrients.sugar).toBeNull();
  });
});
describe('天气外部数据校验', () => {
  it('拒绝越界坐标和不完整天气数据', () => {
    expect(validWeatherLocation(city)).toBe(true);
    expect(validWeatherLocation({ ...city, longitude: 200 })).toBe(false);
    expect(() => parseWeather({ current: { temperature_2m: 20 } }, city)).toThrow();
  });
  it('合法零度不会显示为未知；WMO 文字明确', () => {
    const w = parseWeather(
      {
        current: {
          temperature_2m: 0,
          apparent_temperature: -2,
          weather_code: 61,
          wind_speed_10m: 3,
          time: '2026-10-22T12:00',
        },
        daily: { temperature_2m_max: [4], temperature_2m_min: [-3] },
        timezone: 'UTC',
      },
      city,
    );
    expect(w.temperature).toBe(0);
    expect(weatherLabel(w.code)).toBe('下雨');
    expect(weatherLabel(95)).toBe('雷雨');
  });
});
