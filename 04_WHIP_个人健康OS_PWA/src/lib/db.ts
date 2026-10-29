import Dexie, { type Table } from 'dexie';
import type { Entry, Food, Preferences, Template, Backup } from './types';
import { defaults } from './types';
import { starterFoods } from './catalog';
import { expandedIngredients } from './ingredients';
export const referenceFoods = [...starterFoods, ...expandedIngredients.map((i) => i.food)];
import { validateBackup } from './domain';
export class VitalDB extends Dexie {
  entries!: Table<Entry, string>;
  foods!: Table<Food, string>;
  preferences!: Table<Preferences, string>;
  templates!: Table<Template, string>;
  constructor(name = 'vital-private-v1') {
    super(name);
    this.version(1).stores({
      entries: 'id,kind,date,[kind+date],updatedAt',
      foods: 'id,name',
      preferences: 'id',
      templates: 'id,kind',
    });
  }
}
export const db = new VitalDB();
export async function initialize() {
  await db.transaction('rw', db.foods, db.preferences, db.entries, async () => {
    if (!(await db.preferences.get('profile'))) await db.preferences.put(defaults);
    await db.foods.bulkPut(
      await Promise.all(referenceFoods.map(async (f) => (await db.foods.get(f.id)) ?? f)),
    );
    const active = await db.entries
      .filter((e) => e.kind === 'workout' && e.status === 'active')
      .toArray();
    for (const e of active)
      await db.entries.put({
        ...e,
        status: 'paused',
        pausedAt: e.updatedAt ? Date.parse(e.updatedAt) : Date.now(),
      });
  });
}
export const repository = {
  async save(e: Entry) {
    await db.entries.put({ ...e, updatedAt: new Date().toISOString() });
  },
  async remove(id: string) {
    await db.entries.delete(id);
  },
  async profile(p: Preferences) {
    await db.preferences.put(p);
  },
  async export(): Promise<Backup> {
    const [entries, foods, templates, profile] = await Promise.all([
      db.entries.toArray(),
      db.foods.toArray(),
      db.templates.toArray(),
      db.preferences.get('profile'),
    ]);
    return {
      app: 'WHIP',
      version: 1,
      exportedAt: new Date().toISOString(),
      entries,
      foods,
      templates,
      profile: profile ?? defaults,
    };
  },
  async import(raw: unknown, mode: 'merge' | 'replace') {
    const b = validateBackup(raw);
    let inserted = 0;
    await db.transaction('rw', db.entries, db.foods, db.templates, db.preferences, async () => {
      if (mode === 'replace') {
        await db.entries.clear();
        await db.foods.clear();
        await db.templates.clear();
        await db.preferences.put(b.profile);
      }
      const [existingEntries, existingFoods, existingTemplates] = await Promise.all([
        db.entries.bulkGet(b.entries.map((e) => e.id)),
        db.foods.bulkGet(b.foods.map((f) => f.id)),
        db.templates.bulkGet(b.templates.map((t) => t.id)),
      ]);
      const newEntries = b.entries
        .filter((_, i) => !existingEntries[i])
        .map((e) =>
          e.kind === 'workout' && e.status !== 'done'
            ? { ...e, status: 'paused' as const, pausedAt: e.pausedAt ?? Date.parse(e.updatedAt) }
            : e,
        );
      inserted = newEntries.length;
      await db.entries.bulkPut(newEntries);
      await db.foods.bulkPut(b.foods.filter((_, i) => !existingFoods[i]));
      await db.templates.bulkPut(b.templates.filter((_, i) => !existingTemplates[i]));
    });
    return inserted;
  },
  async clear() {
    await db.transaction('rw', db.entries, db.foods, db.preferences, db.templates, async () => {
      await db.entries.clear();
      await db.foods.clear();
      await db.preferences.clear();
      await db.templates.clear();
      await db.preferences.put({ ...defaults, onboarded: true });
      await db.foods.bulkPut(referenceFoods);
    });
  },
};
export function download(content: string, name: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
