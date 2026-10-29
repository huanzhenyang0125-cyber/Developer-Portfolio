import { useEffect, useState } from 'react';
import { Search, Star, Plus, ChevronLeft, Check, Utensils, ChefHat } from 'lucide-react';
import type { Entry, Food, Nutrients } from '../lib/types';
import { scale, makeEntry, uid, fmt, totals } from '../lib/domain';
import { db, repository } from '../lib/db';
import { useUI, attempt } from '../lib/store';
import { localFoodNames } from '../lib/catalog';
import { Field, number } from '../components/ui';
export const qualityLabel = {
  reference: '参考数据库',
  estimate: '估算值',
  label: '标签录入 · 未核验',
  user: '自行录入',
};
export function FoodForm({ foods, entries }: { foods: Food[]; entries: Entry[] }) {
  const { edit, day, close, notify, foodSelection, foodPortion, open } = useUI();
  const [query, setQuery] = useState(''),
    [filter, setFilter] = useState('最近'),
    [selected, setSelected] = useState<Food | undefined>(
      foods.find((f) => f.id === (edit?.foodId ?? foodSelection)),
    ),
    [amount, setAmount] = useState(edit?.amount ?? (foodSelection ? foodPortion : 100)),
    [meal, setMeal] = useState(edit?.meal ?? sessionStorage.getItem('vital-meal') ?? '午餐'),
    [date, setDate] = useState(edit?.date ?? day),
    [mode, setMode] = useState('search'),
    [busy, setBusy] = useState(false),
    [unit, setUnit] = useState('base');
  useEffect(() => {
    if (foodSelection && !selected) setSelected(foods.find((f) => f.id === foodSelection));
  }, [foodSelection, foods, selected]);
  const prior = selected
    ? entries
        .filter((e) => e.foodId === selected.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    : undefined;
  const rank = (f: Food) => entries.filter((e) => e.foodId === f.id).length;
  const recentIds = [...entries]
    .filter((e) => e.foodId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((e) => e.foodId);
  const list = foods
    .filter(
      (f) =>
        (filter !== '收藏' || f.favorite) &&
        (!query || (f.name + f.english + f.aliases).toLowerCase().includes(query.toLowerCase())),
    )
    .sort((a, b) =>
      filter === '常吃'
        ? rank(b) - rank(a)
        : (recentIds.indexOf(a.id) < 0 ? 1e9 : recentIds.indexOf(a.id)) -
          (recentIds.indexOf(b.id) < 0 ? 1e9 : recentIds.indexOf(b.id)),
    );
  const scaled = selected ? scale(selected.nutrients, Math.max(0.01, amount)) : null;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    const ok = await attempt(
      () =>
        repository.save({
          ...(edit ?? makeEntry('meal', selected.name, date)),
          date,
          name: selected.name,
          foodId: selected.id,
          amount,
          unit: selected.basis,
          meal,
          nutrients: scale(selected.nutrients, amount),
          quality: selected.quality,
          source: selected.source + ' · ' + selected.sourceId,
        }),
      '饮食记录已保存',
    );
    setBusy(false);
    if (ok) {
      sessionStorage.removeItem('vital-meal');
      close();
    }
  }
  if (mode === 'custom')
    return (
      <CustomFood
        onBack={() => setMode('search')}
        onSaved={(f) => {
          setSelected(f);
          setMode('search');
        }}
      />
    );
  if (mode === 'recipe')
    return (
      <RecipeForm
        foods={foods}
        onBack={() => setMode('search')}
        onSaved={(f) => {
          setSelected(f);
          setMode('search');
        }}
      />
    );
  return selected ? (
    <form onSubmit={submit}>
      <button type="button" className="text-button" onClick={() => setSelected(undefined)}>
        <ChevronLeft size={16} />
        返回食物搜索
      </button>
      <div className="selected-food">
        <div className="icon-box peach">
          <Utensils size={23} />
        </div>
        <h3>{selected.name}</h3>
        <p>{selected.english}</p>
        <span className="tag">{qualityLabel[selected.quality]}</span>
      </div>
      <div className="nutrition-preview">
        {(
          [
            ['能量', scaled?.calories, 'kcal'],
            ['蛋白质', scaled?.protein, 'g'],
            ['碳水', scaled?.carbs, 'g'],
            ['脂肪', scaled?.fat, 'g'],
          ] as const
        ).map(([l, v, u]) => (
          <div key={l}>
            <small>{l}</small>
            <strong>{number(v, 1)}</strong>
            <span>{u}</span>
          </div>
        ))}
      </div>
      <div className="form-grid">
        <Field label="份量单位">
          <select
            value={unit}
            onChange={(e) => {
              setUnit(e.target.value);
              if (e.target.value !== 'base')
                setAmount(selected.servings[Number(e.target.value)].amount);
            }}
          >
            <option value="base">{selected.basis === 'g' ? '克 (g)' : '毫升 (ml)'}</option>
            {selected.servings.map((s, i) => (
              <option key={i} value={i}>
                {s.name} = {s.amount}
                {selected.basis}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label={'实际份量 (' + selected.basis + ')'}
          hint="每种食物的份量转换独立保存；不假设一碗或一杯的统一重量。"
        >
          <input
            required
            type="number"
            step="0.1"
            min="0.1"
            max="100000"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </Field>
        <Field label="餐次">
          <select value={meal} onChange={(e) => setMeal(e.target.value)}>
            {['早餐', '午餐', '晚餐', '加餐', '其他'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="记录日期">
          <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      {prior && (
        <button
          type="button"
          className="button secondary full-width"
          onClick={() => setAmount(prior.amount ?? 100)}
        >
          沿用上次份量 · {prior.amount} {selected.basis}
        </button>
      )}
      <p className="source-note">
        来源：{selected.source} · {selected.sourceId}。营养基准为每 100{selected.basis}。
        {selected.quality === 'estimate'
          ? '此食物为估算，实际值可能因配料和烹饪方式不同。'
          : '通用参考值或自行录入值可能与实际品牌不同。'}
      </p>
      <button className="button primary full-width" disabled={busy}>
        <Check size={18} />
        {busy ? '保存中…' : edit ? '保存修改' : '确认记录'}
      </button>
      {edit && <EntryActions entry={edit} />}
    </form>
  ) : (
    <>
      <div className="search-field">
        <Search size={19} />
        <input
          aria-label="搜索食物"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="食物、英文或拼音，如 mifan"
          autoComplete="off"
        />
      </div>
      <div className="toolbar">
        <button className="button secondary" onClick={() => open('dishes')}>
          菜品、食材与饮料库
        </button>
        <button className="button secondary" onClick={() => open('photo-food')}>
          拍照辅助识别
        </button>
      </div>
      <div className="pills">
        {['最近', '收藏', '常吃', '全部'].map((f) => (
          <button key={f} className={filter === f ? 'selected' : ''} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>
      <div className="food-results">
        {list.map((f) => (
          <div className="food-result" key={f.id}>
            <button
              className="food-select"
              onClick={() => {
                setSelected(f);
                const last = entries
                  .filter((e) => e.foodId === f.id)
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
                setAmount(last?.amount ?? 100);
              }}
            >
              <span className="food-letter">{f.name.slice(0, 1)}</span>
              <span>
                <strong>{f.name}</strong>
                <small>
                  {qualityLabel[f.quality]} · {fmt(f.nutrients.calories)} kcal / 100{f.basis}
                </small>
              </span>
              <Plus size={18} />
            </button>
            <button
              className={'icon-button favorite ' + (f.favorite ? 'is-favorite' : '')}
              aria-label={f.favorite ? '取消收藏' + f.name : '收藏' + f.name}
              onClick={() => attempt(() => db.foods.update(f.id, { favorite: !f.favorite }))}
            >
              <Star size={17} fill={f.favorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        ))}
        {!list.length && (
          <div className="empty">
            <p>
              没有找到这份食物。
              <br />
              可按包装标签添加，或明确标记为估算。
            </p>
          </div>
        )}
      </div>
      <div className="toolbar">
        <button className="button secondary" onClick={() => setMode('custom')}>
          <Plus size={16} />
          自建食物
        </button>
        <button className="button secondary" onClick={() => setMode('recipe')}>
          <ChefHat size={17} />
          创建食谱
        </button>
      </div>
      <p className="source-note">
        离线目录含通用参考食物。鸡饭、椰浆饭、煎饼等混合菜式差异较大，请用实际标签或自建估算记录。
      </p>
      {query && localFoodNames.some((x) => x.toLowerCase().includes(query.toLowerCase())) && (
        <p className="source-note">
          已识别本地菜名。请点击「自建食物」填写份量与来源，不自动套用看似精确的数值。
        </p>
      )}
    </>
  );
}
export function EntryActions({ entry }: { entry: Entry }) {
  const { close, notify } = useUI();
  return (
    <div className="entry-actions">
      <button
        className="text-button"
        type="button"
        onClick={() =>
          attempt(
            () => repository.save({ ...entry, id: uid(), createdAt: new Date().toISOString() }),
            '记录已复制',
          )
        }
      >
        复制记录
      </button>
      <button
        className="text-button"
        type="button"
        onClick={() =>
          attempt(
            () =>
              db.templates.put({
                id: uid(),
                name: entry.name,
                kind: entry.kind === 'workout' ? 'workout' : 'meal',
                entries: [entry],
                createdAt: new Date().toISOString(),
              }),
            '已保存为模板',
          )
        }
      >
        存为模板
      </button>
      <button
        className="text-button danger"
        type="button"
        onClick={() => {
          if (confirm('删除这条记录？此操作不可撤销。'))
            void attempt(async () => {
              await repository.remove(entry.id);
              close();
              notify('记录已删除');
            });
        }}
      >
        删除记录
      </button>
    </div>
  );
}
function CustomFood({ onBack, onSaved }: { onBack: () => void; onSaved: (f: Food) => void }) {
  const [name, setName] = useState(''),
    [english, setEnglish] = useState(''),
    [quality, setQuality] = useState<Food['quality']>('user'),
    [basis, setBasis] = useState<Food['basis']>('g'),
    [source, setSource] = useState('自行录入'),
    [serving, setServing] = useState(''),
    [servingAmount, setServingAmount] = useState(''),
    [values, setValues] = useState<Record<string, string>>({ calories: '' });
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !source.trim()) {
      useUI.getState().fail(Error('请填写食物名称和来源说明'));
      return;
    }
    setBusy(true);
    const nutrients = Object.fromEntries(
      [
        'calories',
        'protein',
        'carbs',
        'fat',
        'fiber',
        'sugar',
        'sodium',
        'saturatedFat',
        'caffeine',
      ].map((k) => [k, values[k] ? Number(values[k]) : null]),
    ) as unknown as Nutrients;
    const f: Food = {
      id: uid(),
      name: name.trim(),
      english,
      aliases: name + ' ' + english,
      quality,
      basis,
      source,
      sourceId: '用户自建',
      retrievedAt: new Date().toISOString(),
      nutrients,
      servings:
        serving && Number(servingAmount) > 0
          ? [{ name: serving, amount: Number(servingAmount) }]
          : [],
    };
    const ok = await attempt(() => db.foods.put(f), '食物已保存');
    setBusy(false);
    if (ok) onSaved(f);
  }
  return (
    <form onSubmit={submit}>
      <button type="button" className="text-button" onClick={onBack}>
        <ChevronLeft size={16} />
        返回搜索
      </button>
      <p className="muted text-sm">
        按每 100 g / ml 填写。未知营养请留空；标签录入不会被标为已核验。
      </p>
      <div className="form-grid">
        <Field label="食物名称">
          <input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="英文 / 搜索别名">
          <input value={english} onChange={(e) => setEnglish(e.target.value)} />
        </Field>
        <Field label="数据状态">
          <select value={quality} onChange={(e) => setQuality(e.target.value as Food['quality'])}>
            <option value="user">自行录入</option>
            <option value="label">包装标签（自行抄录）</option>
            <option value="estimate">估算值</option>
          </select>
        </Field>
        <Field label="营养基准">
          <select value={basis} onChange={(e) => setBasis(e.target.value as Food['basis'])}>
            <option value="g">每 100 g</option>
            <option value="ml">每 100 ml</option>
          </select>
        </Field>
        {[
          ['calories', '热量 (kcal)'],
          ['protein', '蛋白质 (g)'],
          ['carbs', '碳水 (g)'],
          ['fat', '脂肪 (g)'],
          ['fiber', '膳食纤维 (g)'],
          ['sugar', '糖 (g)'],
          ['sodium', '钠 (mg)'],
          ['saturatedFat', '饱和脂肪 (g)'],
          ['caffeine', '咖啡因 (mg)'],
        ].map(([k, l]) => (
          <Field key={k} label={l}>
            <input
              required={k === 'calories'}
              type="number"
              min="0"
              max={k === 'sodium' ? 100000 : 10000}
              step="0.01"
              value={values[k] ?? ''}
              onChange={(e) => setValues({ ...values, [k]: e.target.value })}
            />
          </Field>
        ))}
        <Field label="数据来源说明">
          <input
            required
            maxLength={300}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </Field>
        <Field label="自定义份量（可选）">
          <input
            placeholder="如：一碗、一个、一杯"
            value={serving}
            onChange={(e) => setServing(e.target.value)}
          />
        </Field>
        <Field label={'该份量对应 ' + basis}>
          <input
            type="number"
            min="0.1"
            max="100000"
            step="0.1"
            required={!!serving}
            value={servingAmount}
            onChange={(e) => setServingAmount(e.target.value)}
          />
        </Field>
      </div>
      <button disabled={busy} className="button primary full-width">
        保存食物并选择份量
      </button>
    </form>
  );
}
function RecipeForm({
  foods,
  onBack,
  onSaved,
}: {
  foods: Food[];
  onBack: () => void;
  onSaved: (f: Food) => void;
}) {
  const [name, setName] = useState(''),
    [rows, setRows] = useState<{ id: string; grams: number }[]>([
      { id: foods[0]?.id ?? '', grams: 100 },
    ]),
    [yieldGrams, setYield] = useState(100),
    [servings, setServings] = useState(1);
  const ingredients = rows.map((r) => {
    const f = foods.find((f) => f.id === r.id)!;
    return { ...makeEntry('meal', f.name), nutrients: scale(f.nutrients, Math.max(0.1, r.grams)) };
  });
  const sum = totals(ingredients);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) {
          useUI.getState().fail(Error('请填写食谱名称'));
          return;
        }
        const f: Food = {
          id: uid(),
          name: name.trim(),
          english: 'Personal recipe',
          aliases: name,
          basis: 'g',
          quality: 'estimate',
          source:
            '自建食谱：' +
            rows
              .map((r) => {
                const food = foods.find((f) => f.id === r.id)!;
                return `${food.name} ${r.grams}${food.basis} (${food.sourceId})`;
              })
              .join('；'),
          sourceId: `成品 ${yieldGrams}g / ${servings} 份`,
          nutrients: scale(sum, 10000 / yieldGrams),
          servings: [{ name: '份', amount: yieldGrams / servings }],
        };
        void attempt(async () => {
          await db.foods.put(f);
          onSaved(f);
        }, '食谱已保存');
      }}
    >
      <button type="button" className="text-button" onClick={onBack}>
        <ChevronLeft size={16} />
        返回搜索
      </button>
      <Field label="食谱名称">
        <input required value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <p className="muted text-sm">
        逐项计算食材营养，再按成品重量与份数分配。未知营养不会被当作零。
      </p>
      {rows.map((r, i) => (
        <div className="recipe-row" key={i}>
          <select
            aria-label={'食材' + (i + 1)}
            value={r.id}
            onChange={(e) =>
              setRows(rows.map((x, j) => (i === j ? { ...x, id: e.target.value } : x)))
            }
          >
            {foods.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.basis})
              </option>
            ))}
          </select>
          <input
            aria-label="食材份量"
            type="number"
            required
            min=".1"
            max="10000"
            step=".1"
            value={r.grams}
            onChange={(e) =>
              setRows(rows.map((x, j) => (i === j ? { ...x, grams: Number(e.target.value) } : x)))
            }
          />
          <button
            type="button"
            className="icon-button"
            aria-label="移除食材"
            disabled={rows.length === 1}
            onClick={() => setRows(rows.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="button secondary"
        onClick={() => setRows([...rows, { id: foods[0].id, grams: 100 }])}
      >
        <Plus size={16} />
        添加食材
      </button>
      <div className="form-grid">
        <Field label="成品总重量 (g)">
          <input
            required
            type="number"
            min="1"
            max="100000"
            value={yieldGrams}
            onChange={(e) => setYield(Number(e.target.value))}
          />
        </Field>
        <Field label="分成几份">
          <input
            required
            type="number"
            min="1"
            max="1000"
            value={servings}
            onChange={(e) => setServings(Number(e.target.value))}
          />
        </Field>
      </div>
      <div className="callout">
        整份食谱：{fmt(sum.calories)} kcal · 每份 {fmt(sum.calories / Math.max(1, servings))} kcal
      </div>
      <button className="button primary full-width">保存为食物</button>
    </form>
  );
}
