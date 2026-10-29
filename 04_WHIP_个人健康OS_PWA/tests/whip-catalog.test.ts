import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { ingredients, expandedIngredients, ingredientByKey } from '../src/lib/ingredients';
import { allDishes, recipeDishes, recipeNutrients, recipeFood } from '../src/lib/recipes';
import { drinks, drinkSource } from '../src/lib/drinks';
import { makeEntry, validateBackup, scale, totals } from '../src/lib/domain';
import { db, initialize, repository } from '../src/lib/db';
import { sugarAmount, sugarCubes } from '../src/lib/protocol';
beforeEach(async () => {
  await db.entries.clear();
  await db.foods.clear();
  await db.preferences.clear();
  await db.templates.clear();
  await initialize();
});
describe('WHIP 菜品与食材扩充', () => {
  it('104项有状态和来源的独立食材；72道菜中60份可编辑配方', () => {
    expect(ingredients).toHaveLength(104);
    expect(new Set(ingredients.map((i) => i.food.id)).size).toBe(104);
    expect(allDishes).toHaveLength(72);
    expect(recipeDishes).toHaveLength(60);
    for (const i of expandedIngredients) {
      expect(i.food.sourceId).toMatch(/^FDC \d+ \/ NDB \d+$/);
      expect(i.food.sourceURL).toMatch(/^https:\/\/fdc.nal.usda.gov\/food-details\//);
      expect(i.food.nutrients.calories).toBeGreaterThanOrEqual(0);
      expect(i.food.nutrients.calories).toBeLessThanOrEqual(900);
    }
  });
  it('所有配方食材可追溯，份量与能量有限', () => {
    for (const r of recipeDishes) {
      for (const p of r.parts) {
        expect(ingredientByKey.has(p.key), r.name + ' ' + p.key).toBe(true);
        expect(p.grams).toBeGreaterThanOrEqual(0);
      }
      const n = recipeNutrients(r.parts, r.yieldGrams);
      expect(n.calories).toBeGreaterThan(0);
      expect(n.calories).toBeLessThan(900);
      expect(recipeFood(r).quality).toBe('estimate');
    }
  });
  it('改变出成率只改变密度，不改变整锅总能量', () => {
    const r = recipeDishes[0],
      a = recipeNutrients(r.parts, r.yieldGrams),
      b = recipeNutrients(r.parts, r.yieldGrams * 2);
    expect((a.calories * r.yieldGrams) / 100).toBeCloseTo((b.calories * r.yieldGrams * 2) / 100);
    expect(a.calories).toBeCloseTo(b.calories * 2);
    const noOil = r.parts.map((p) => (p.key === 'canola-oil' ? { ...p, grams: 0 } : p));
    expect(a.calories - recipeNutrients(noOil, r.yieldGrams).calories).toBeCloseTo(
      (ingredientByKey.get('canola-oil')!.food.nutrients.calories * 10) / r.yieldGrams,
    );
  });
  it('不认识的食材、坏重量或空配方拒绝，未知营养仍是null', () => {
    expect(() => recipeNutrients([{ key: 'missing', grams: 10 }], 100)).toThrow();
    expect(() => recipeNutrients([{ key: 'rice', grams: -1 }], 100)).toThrow();
    expect(() => recipeNutrients([{ key: 'rice', grams: 100 }], 0)).toThrow();
    expect(() => recipeNutrients([{ key: 'rice', grams: 0 }], 100)).toThrow();
    expect(recipeNutrients([{ key: 'rice', grams: 100 }], 100).sugar).toBeNull();
    expect(
      recipeNutrients(
        [
          { key: 'rice', grams: 0 },
          { key: 'carrot', grams: 100 },
        ],
        100,
      ).sugar,
    ).toBe(ingredientByKey.get('carrot')!.food.nutrients.sugar);
  });
  it('升级添加参考食材，不覆盖旧收藏、旧饮食或旧目标', async () => {
    const old = await db.foods.get('usda-rice');
    await db.foods.put({ ...old!, favorite: true });
    await repository.save({
      ...makeEntry('meal', '原有米饭'),
      amount: 100,
      nutrients: old!.nutrients,
    });
    const p = await db.preferences.get('profile');
    await repository.profile({ ...p!, calories: 2300 });
    await initialize();
    expect(await db.foods.count()).toBe(104);
    expect((await db.foods.get('usda-rice'))!.favorite).toBe(true);
    expect(totals(await db.entries.toArray()).calories).toBe(130);
    expect((await db.preferences.get('profile'))!.calories).toBe(2300);
  });
  it('新WHIP备份和旧VITAL备份都可恢复，身份不改IndexedDB名称', async () => {
    const b = await repository.export();
    expect(b.app).toBe('WHIP');
    expect(validateBackup({ ...b, app: 'VITAL' }).app).toBe('VITAL');
    expect(validateBackup(b).foods).toHaveLength(104);
    expect(db.name).toBe('vital-private-v1');
  });
});
describe('中马30款饮料与糖单位', () => {
  it('独立SKU与地区，所有条目有官方来源，未知不归零', () => {
    expect(drinks).toHaveLength(30);
    expect(new Set(drinks.map((d) => d.id)).size).toBe(30);
    expect(new Set(drinks.map((d) => d.market))).toEqual(new Set(['中国大陆', '马来西亚']));
    expect(drinks.filter((d) => d.sugarPer100 !== null)).toHaveLength(22);
    expect(drinks.filter((d) => d.sugarPer100 === null)).toHaveLength(8);
    for (const d of drinks) {
      expect(d.sourceUrl).toMatch(/^https:\/\//);
      expect(d.sourceBasis.length).toBeGreaterThan(5);
      expect(drinkSource(d).length).toBeLessThanOrEqual(500);
      expect(d.defaultMl).toBeGreaterThan(0);
      if (d.sugarPer100 !== null) {
        expect(d.sugarPer100).toBeGreaterThanOrEqual(0);
        expect(d.sugarPer100).toBeLessThanOrEqual(100);
      }
    }
  });
  it('明确的250ml红牛27g糖、114kcal换算准确', () => {
    const d = drinks.find((d) => d.id === 'my-redbull-blue-silver')!;
    expect(sugarAmount(250, d.sugarPer100!)).toBe(27);
    expect(sugarCubes(27)).toBe(6.75);
    expect(d.kcalPer100! * 2.5).toBe(114);
  });
  it('300ml茶饮换算和零糖声明不混用碳水，不跨地区套可乐', () => {
    const tea = drinks.find((d) => d.id === 'my-fuze-lemon')!;
    expect(sugarAmount(300, tea.sugarPer100!)).toBeCloseTo(12.9);
    const zero = drinks.find((d) => d.id === 'cn-oriental-jasmine')!;
    expect(zero.sugarPer100).toBe(0);
    expect(sugarAmount(500, zero.sugarPer100!)).toBe(0);
    expect(drinks.find((d) => d.id === 'cn-coke-original')!.sugarPer100).toBeNull();
  });
});
