import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db, initialize, repository } from '../src/lib/db';
import { makeEntry, scale } from '../src/lib/domain';
import { defaults } from '../src/lib/types';
beforeEach(async () => {
  await db.entries.clear();
  await db.foods.clear();
  await db.preferences.clear();
  await db.templates.clear();
  await initialize();
});
describe('真实 IndexedDB repository (fake-indexeddb)', () => {
  it('初次使用无虚假记录，仅播种参考目录', async () => {
    expect(await db.entries.count()).toBe(0);
    expect(await db.foods.count()).toBe(104);
    expect((await db.preferences.get('profile'))?.onboarded).toBe(false);
  });
  it('CRUD 与再次初始化后保留记录', async () => {
    const e = { ...makeEntry('water', '白水'), amount: 250, unit: 'ml' };
    await repository.save(e);
    expect((await db.entries.get(e.id))?.amount).toBe(250);
    await repository.save({ ...e, amount: 350 });
    await initialize();
    expect((await db.entries.get(e.id))?.amount).toBe(350);
    await repository.remove(e.id);
    expect(await db.entries.get(e.id)).toBeUndefined();
  });
  it('导出导入一致、合并不覆盖重复项', async () => {
    const e = { ...makeEntry('water', '白水'), amount: 250, unit: 'ml' };
    await repository.save(e);
    const b = await repository.export();
    await repository.save({ ...e, amount: 500 });
    expect(await repository.import(b, 'merge')).toBe(0);
    expect((await db.entries.get(e.id))?.amount).toBe(500);
    await db.entries.clear();
    expect(await repository.import(b, 'merge')).toBe(1);
    expect((await db.entries.get(e.id))?.amount).toBe(250);
  });
  it('完整替换恢复设置，合并保留当前设置', async () => {
    const b = await repository.export();
    b.profile = { ...defaults, name: '备份昵称' };
    await repository.profile({ ...defaults, name: '当前昵称' });
    await repository.import(b, 'merge');
    expect((await db.preferences.get('profile'))?.name).toBe('当前昵称');
    await repository.import(b, 'replace');
    expect((await db.preferences.get('profile'))?.name).toBe('备份昵称');
  });
  it('坏备份不破坏已有数据', async () => {
    await repository.save({ ...makeEntry('water', '白水'), amount: 500 });
    const b = await repository.export();
    b.entries[0].amount = -3;
    await expect(repository.import(b, 'replace')).rejects.toThrow();
    expect((await db.entries.toArray())[0].amount).toBe(500);
  });
  it('营养编辑重算后持久化', async () => {
    const e = {
      ...makeEntry('meal', '测试'),
      amount: 100,
      nutrients: scale({ calories: 100, protein: 10, carbs: 15, fat: 0 }, 100),
    };
    await repository.save(e);
    await repository.save({
      ...e,
      amount: 200,
      nutrients: scale({ calories: 100, protein: 10, carbs: 15, fat: 0 }, 200),
    });
    expect((await db.entries.get(e.id))?.nutrients?.calories).toBe(200);
  });
  it('活动重启时暂停，避免补算后台 GPS', async () => {
    const e = { ...makeEntry('workout', '户外跑步'), status: 'active' as const, start: Date.now() };
    await repository.save(e);
    await initialize();
    expect((await db.entries.get(e.id))?.status).toBe('paused');
  });
  it('一年记录量 CRUD 与备份', async () => {
    const records = Array.from({ length: 3650 }, (_, i) => ({
      ...makeEntry(
        'water',
        '白水',
        `2026-${String((Math.floor(i / 310) % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      ),
      amount: 250,
      unit: 'ml',
    }));
    await db.entries.bulkPut(records);
    const b = await repository.export();
    expect(b.entries.length).toBe(3650);
    await db.entries.clear();
    await repository.import(b, 'merge');
    expect(await db.entries.count()).toBe(3650);
  }, 15000);
  it('删除全部清理记录、照片、模板和自建食物', async () => {
    await repository.save({ ...makeEntry('photo', '照片'), photo: 'data:image/jpeg;base64,AA==' });
    await repository.clear();
    expect(await db.entries.count()).toBe(0);
    expect(await db.templates.count()).toBe(0);
    expect(await db.foods.count()).toBe(104);
  });
});
