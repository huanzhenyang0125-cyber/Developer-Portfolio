import { useState } from 'react';
import { Search, Utensils, Flame, ChefHat, ArrowUpRight, Check, Camera } from 'lucide-react';
import { dishes, type Dish } from '../lib/dishes';
import type { Food } from '../lib/types';
import { db } from '../lib/db';
import { useUI, attempt } from '../lib/store';
import { uid, fmt } from '../lib/domain';
import { Field } from '../components/ui';
export function DishMenu() {
  const [query, setQuery] = useState(''),
    [category, setCategory] = useState('全部'),
    [custom, setCustom] = useState<Dish | null>(null);
  const { selectFood, open } = useUI();
  if (custom) return <CustomDish dish={custom} onBack={() => setCustom(null)} />;
  async function choose(d: Dish) {
    if (!d.food) {
      setCustom(d);
      return;
    }
    await attempt(async () => {
      if (!(await db.foods.get(d.food!.id))) await db.foods.put(d.food!);
      selectFood(d.food!.id, d.defaultGrams);
    });
  }
  return (
    <div className="dish-menu">
      <div className="dish-introduction">
        <ChefHat size={25} />
        <div>
          <h3>记录你吃的菜，不只是一种食材。</h3>
          <p>以熟食参考值开始，再确认实际份量与做法。</p>
        </div>
      </div>
      <div className="search-field">
        <Search size={18} />
        <input
          aria-label="搜索菜品"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="炒粿条、炒饭、烧烤、火锅…"
        />
      </div>
      <div className="pills">
        {['全部', '饭与面', '烧烤与火锅', '港式与家常'].map((c) => (
          <button
            key={c}
            className={category === c ? 'selected' : ''}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="dish-grid">
        {dishes
          .filter(
            (d) =>
              (category === '全部' || d.category === category) &&
              (d.name + d.english).toLowerCase().includes(query.toLowerCase()),
          )
          .map((d) => (
            <button className="dish-card" key={d.id} onClick={() => choose(d)}>
              <span className="dish-illustration">
                <DishArtwork
                  type={
                    d.category === '烧烤与火锅'
                      ? d.id === 'dish-hotpot'
                        ? 'hotpot'
                        : 'skewers'
                      : d.name.includes('饭')
                        ? 'rice'
                        : 'noodles'
                  }
                />
              </span>
              <span className="dish-card-copy">
                <strong>{d.name}</strong>
                <small>{d.english}</small>
                <span className="dish-energy">
                  {d.food ? `${fmt(d.food.nutrients.calories)} kcal / 100 g` : '热量待补充'}
                  <ArrowUpRight size={14} />
                </span>
              </span>
            </button>
          ))}
      </div>
      <p className="source-note">
        来源：香港食安中心熟食研究（2006）、马来西亚卫生部
        MyFCD（1997）。参考菜式与实际餐厅可能不同。菜单标示的 250–400 g
        仅是可修改的输入起点，不是测量结果。
      </p>
      <button className="button secondary full-width" onClick={() => open('photo-food')}>
        <Camera size={17} />
        拍照辅助选择菜品
      </button>
    </div>
  );
}
export function DishArtwork({ type }: { type: string }) {
  return (
    <svg viewBox="0 0 120 88" fill="none" aria-hidden="true" className="dish-artwork">
      <ellipse cx="60" cy="68" rx="45" ry="7" fill="currentColor" opacity=".04" />
      {type === 'skewers' ? (
        <>
          <path
            d="M26 66l53-48M37 72l51-47"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {[
            [42, 48],
            [55, 36],
            [68, 24],
            [51, 58],
            [65, 45],
            [78, 33],
          ].map(([x, y], i) => (
            <rect
              key={i}
              x={x - 8}
              y={y - 6}
              width="15"
              height="12"
              rx="4"
              transform={`rotate(-42 ${x} ${y})`}
              fill="currentColor"
              opacity={0.12 + i * 0.02}
            />
          ))}
        </>
      ) : (
        <>
          <ellipse
            cx="60"
            cy="46"
            rx="40"
            ry="12"
            fill="currentColor"
            opacity=".04"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M20 46c4 26 18 28 40 28s36-2 40-28" stroke="currentColor" strokeWidth="1.5" />
          {type === 'rice' ? (
            <path
              d="M31 43c5-17 16-24 29-23s25 9 29 23M41 39l4-4m9 2l3-4m11 1l4 3m6 0l3 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          ) : type === 'hotpot' ? (
            <>
              <path
                d="M28 43c13-12 24-11 35-6 10 5 17-4 29 4M60 34v23M17 45h-8v8h14m80-8h8v8h-14"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle cx="42" cy="43" r="4" fill="currentColor" opacity=".15" />
              <circle cx="77" cy="44" r="5" fill="currentColor" opacity=".12" />
            </>
          ) : (
            <path
              d="M32 42c10-13 16 8 27-2s16-1 29 3M36 47c12-13 17 8 27-2s15-2 21 2M41 35c10-9 15 5 22-1s12-2 17 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          )}
          <path
            d="M45 18c-5-5 5-5 0-11m17 10c-5-5 5-5 0-11m16 15c-5-5 5-5 0-11"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity=".35"
          />
        </>
      )}
    </svg>
  );
}
export function CustomDish({ dish, onBack }: { dish: Dish; onBack: () => void }) {
  const [name, setName] = useState(dish.name),
    [calories, setCalories] = useState(''),
    [grams, setGrams] = useState(dish.defaultGrams),
    [source, setSource] = useState('自己的估算'),
    [sugar, setSugar] = useState(''),
    [busy, setBusy] = useState(false);
  const selectFood = useUI((s) => s.selectFood);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !source.trim()) return;
        setBusy(true);
        void attempt(async () => {
          const f: Food = {
            id: uid(),
            name: name.trim(),
            english: dish.english,
            aliases: name,
            quality: 'estimate',
            basis: 'g',
            source: source.trim(),
            sourceId: '用户菜品估算',
            nutrients: {
              calories: Number(calories),
              protein: null,
              carbs: null,
              fat: null,
              sugar: sugar === '' ? null : Number(sugar),
            },
            servings: [],
          };
          await db.foods.put(f);
          selectFood(f.id, grams);
        }).finally(() => setBusy(false));
      }}
    >
      <button className="text-button" type="button" onClick={onBack}>
        返回菜单
      </button>
      <div className="custom-dish-art">
        <DishArtwork type={dish.id === 'dish-hotpot' ? 'hotpot' : 'skewers'} />
      </div>
      <h3>{dish.name}</h3>
      <p className="muted text-sm">{dish.description}</p>
      <Field label="菜品名称">
        <input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div className="form-grid">
        <Field label="热量 / 每 100 g (kcal)">
          <input
            required
            type="number"
            min="0"
            max="900"
            step=".1"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="按菜单或自己的估算填写"
          />
        </Field>
        <Field label="实际吃下的份量 (g)">
          <input
            required
            type="number"
            min="1"
            max="10000"
            value={grams}
            onChange={(e) => setGrams(Number(e.target.value))}
          />
        </Field>
        <Field label="糖 / 每 100 g，可留空 (g)">
          <input
            type="number"
            min="0"
            max="100"
            step=".1"
            value={sugar}
            onChange={(e) => setSugar(e.target.value)}
          />
        </Field>
        <Field label="数据来源">
          <input
            required
            maxLength={300}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </Field>
      </div>
      <div className="callout">
        {calories !== ''
          ? `本份估算 ${fmt((Number(calories) * grams) / 100)} kcal`
          : '补充热量后可预览本份估算。'}
        。不会把未知营养当作零。
      </div>
      <button disabled={busy} className="button primary full-width">
        <Check size={17} />
        确认估算，继续记录
      </button>
    </form>
  );
}
