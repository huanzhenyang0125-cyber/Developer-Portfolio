# WHIP 1.2 当前状态

WHIP 1.2无IndexedDB结构迁移，继续使用vital-private-v1/version1。初始化只新增不存在的88个参考食材ID，保留旧值、收藏和记录。配方示例由公开静态目录计算，采用后才生成Food；饮食确认后才生成Entry。导出app标记WHIP，校验器兼容VITAL/WHIP。饮料未知营养保持null；抵抗与自律事件不增加饮食能量。

---

以下为保留的历史说明：

# Local data & export v1

Database `vital-private-v1`, Dexie schema version 1.

| Table | Key / indexes | Meaning |
|---|---|---|
| entries | id; kind, date, [kind+date], updatedAt | Meal, water, workout, body, sleep, mood, supplement, habit, photo |
| foods | id; name | per-100g/ml nutrients, source/ID, quality, servings, favorite |
| preferences | id=profile | targets, name, display units/theme/language, backup date, habit/shortcut configuration |
| templates | id; kind | immutable meal/workout snapshots for reuse |

Entry uses stable UUID, local `YYYY-MM-DD` date, ISO creation/update timestamps, optional IANA timezone. Optional fields are documented in `src/lib/types.ts`; irrelevant fields are absent. Nutrition snapshots remain with meal records even if catalog changes. Workouts embed sets and route points; deleting entry deletes its sets/route/photo. Templates preserve their own snapshots intentionally. Photos are locally compressed JPEG data URLs (max dimension 1200px), not external URLs. Canonical body units are kg/cm, fluids ml, distance m, workout duration seconds, sleep duration hours. Supplement unit is user's exact dosage text.

Nutrients: calories required, optional nutrients numeric or null/absent. Per-100 basis scaling = value × amount / 100. If any meal lacks an optional nutrient, its complete daily total is unknown, rather than an inaccurate partial sum. A complete zero is distinct from missing. Mixed-dish estimates stay visibly estimated. Food conversions are per food, never universal bowl/cup weights.

JSON top level: `{app:"VITAL",version:1,exportedAt,entries,foods,templates,profile}`. Stable IDs enable deduplication. Merge skips conflicting existing IDs, imports new foods/templates, keeps current profile. Replace clears all four tables and restores profile inside the same transaction. Active workouts import paused. Schema validation precedes every mutation; any transaction failure rolls back. Max JSON input is 100MB in UI; 100,000 entries / 10,000 foods / 1,000 templates. Photo and route point size limits reduce malformed backup abuse.

CSV fields: id,kind,date,name,amount,unit,duration,distance,calories,protein,carbs,fat,notes. UTF-8 BOM, quoted cells, escaped quotes/newlines, formula-leading characters prefixed with apostrophe. CSV is a summary, does not contain all source metadata, photo bytes, templates or route points and is not restorable.

Migration policy: add version 2 with additive schema and explicit `upgrade()` transform. Never remove a user's database to fix a model issue. Keep export version separate from Dexie version. No migration has been claimed as tested before it exists.

## Additive desktop / accountability fields

Dexie indexes remain schema1. Preferences add optional avatarStyle/avatar(data URL), weatherLocation(city coordinates), vibration and alertSound. Entries add kind=protocol, eventType(masturbation/sugary-drink/resisted), occurredAt, optional recoveryAt/sugarGrams/sugarPer100/sugarSource. All new fields are import-validated; old records need no migration. Latest app accepts old v1 backups; older builds may reject new protocol kinds and should be upgraded before restoring. Full JSON retains these fields; CSV remains the original summary field set. Protocol events are excluded from meal totals. No identity credentials or remote account are stored in the health DB.
