import { useState } from 'react';
import {
  Search,
  ChefHat,
  Wheat,
  CupSoda,
  ArrowUpRight,
  ChevronLeft,
  Check,
  Plus,
} from 'lucide-react';
import type { Food } from '../lib/types';
import { allDishes, isRecipe, recipeFood, type RecipeDish, type RecipePart } from '../lib/recipes';
import { ingredients, ingredientByKey } from '../lib/ingredients';
import { db } from '../lib/db';
import { useUI, attempt } from '../lib/store';
import { uid, fmt } from '../lib/domain';
import { Field } from '../components/ui';
import { DishArtwork, CustomDish } from './DishMenu';
import type { Dish } from '../lib/dishes';
import { DrinkPicker } from './DrinkLibrary';
import { drinks } from '../lib/drinks';
export function FoodLibrary() {
  const [tab, setTab] = useState<'dishes' | 'ingredients' | 'drinks'>('dishes'),
    [query, setQuery] = useState(''),
    [category, setCategory] = useState('全部'),
    [limit, setLimit] = useState(24),
    [detail, setDetail] = useState<Dish | null>(null);
  const { selectFood, chooseDrink } = useUI();
  if (detail) {
    if (isRecipe(detail)) return <RecipeDetail recipe={detail} onBack={() => setDetail(null)} />;
    if (!detail.food) return <CustomDish dish={detail} onBack={() => setDetail(null)} />;
    return <ReferenceDetail dish={detail} onBack={() => setDetail(null)} />;
  }
  const categories =
    tab === 'dishes'
      ? [...new Set(allDishes.map((d) => d.category))]
      : [...new Set(ingredients.map((i) => i.category))];
  const matchingDishes = allDishes.filter(
    (d) =>
      (category === '全部' || d.category === category) &&
      (
        d.name +
        d.english +
        (isRecipe(d) ? d.parts.map((p) => ingredientByKey.get(p.key)?.food.name).join('') : '')
      )
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const matchingIngredients = ingredients.filter(
    (i) =>
      (category === '全部' || i.category === category) &&
      (i.food.name + i.food.english + i.food.aliases).toLowerCase().includes(query.toLowerCase()),
  );
  async function choose(f: Food, grams = 100) {
    await attempt(async () => {
      if (!(await db.foods.get(f.id))) await db.foods.put(f);
      selectFood(f.id, grams);
    });
  }
  return (
    <div className="food-library">
      <div className="library-intro">
        <span className="eyebrow">WHIP FOOD ATLAS</span>
        <h3>你吃的每一种，这里认真记。</h3>
        <p>
          {allDishes.length} 道菜品 · {ingredients.length} 项食材 · {drinks.length} 款饮料
        </p>
      </div>
      <div className="library-tabs">
        {(
          [
            { id: 'dishes', label: '菜品', count: allDishes.length, Icon: ChefHat },
            { id: 'ingredients', label: '食材', count: ingredients.length, Icon: Wheat },
            { id: 'drinks', label: '饮料', count: drinks.length, Icon: CupSoda },
          ] as const
        ).map(({ id, label, count, Icon }) => (
          <button
            key={id}
            className={tab === id ? 'selected' : ''}
            aria-pressed={tab === id}
            onClick={() => {
              setTab(id);
              setQuery('');
              setCategory('全部');
              setLimit(24);
            }}
          >
            <Icon size={18} />
            {label}
            <small>{count}</small>
          </button>
        ))}
      </div>
      {tab === 'drinks' ? (
        <DrinkPicker onSelect={(d) => chooseDrink(d.id)} />
      ) : (
        <>
          <div className="search-field">
            <Search size={18} />
            <input
              aria-label={tab === 'dishes' ? '搜索菜品或配料' : '搜索食材'}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(24);
              }}
              placeholder={
                tab === 'dishes' ? '搜索菜名或配料：鸡肉、炒饭、火锅…' : '生熟状态、食材名称、英文…'
              }
            />
          </div>
          <div className="catalog-filters">
            {['全部', ...categories].map((c) => (
              <button
                key={c}
                className={category === c ? 'selected' : ''}
                onClick={() => {
                  setCategory(c);
                  setLimit(24);
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <p className="catalog-count">
            找到 {tab === 'dishes' ? matchingDishes.length : matchingIngredients.length} 项 ·{' '}
            {tab === 'dishes' ? '点击查看配料与参考依据' : '生重、熟重已在名称标明'}
          </p>
          <div className={'catalog-grid ' + (tab === 'ingredients' ? 'ingredients-grid' : '')}>
            {tab === 'dishes'
              ? matchingDishes.slice(0, limit).map((d) => (
                  <button key={d.id} className="catalog-dish" onClick={() => setDetail(d)}>
                    <span className="catalog-art">
                      <DishArtwork
                        type={
                          d.category === '烧烤与火锅'
                            ? d.name.includes('锅')
                              ? 'hotpot'
                              : 'skewers'
                            : d.name.includes('饭')
                              ? 'rice'
                              : d.name.includes('面') || d.name.includes('粉')
                                ? 'noodles'
                                : 'hotpot'
                        }
                      />
                      <small>{d.category}</small>
                    </span>
                    <span className="catalog-card-body">
                      <strong>{d.name}</strong>
                      <small>
                        {isRecipe(d)
                          ? d.parts
                              .slice(0, 4)
                              .map((p) =>
                                ingredientByKey.get(p.key)?.food.name.replace(/（.*?）/g, ''),
                              )
                              .join(' · ')
                          : d.description}
                      </small>
                      <span>
                        {isRecipe(d)
                          ? '配方估算 · 可改配料'
                          : d.food
                            ? `${fmt(d.food.nutrients.calories)} kcal / 100g · 参考`
                            : '热量待补充'}
                        <ArrowUpRight size={14} />
                      </span>
                    </span>
                  </button>
                ))
              : matchingIngredients.slice(0, limit).map((i) => (
                  <button
                    className="ingredient-card"
                    key={i.food.id}
                    onClick={() => choose(i.food)}
                  >
                    <span className="ingredient-letter">{i.food.name.slice(0, 1)}</span>
                    <span>
                      <strong>{i.food.name}</strong>
                      <small>
                        {i.category} · {fmt(i.food.nutrients.calories)} kcal / 100g
                      </small>
                    </span>
                    <Plus size={16} />
                  </button>
                ))}
          </div>
          {(tab === 'dishes' ? matchingDishes.length : matchingIngredients.length) === 0 && (
            <div className="empty">
              <p>没有找到匹配项，试试其他名称或分类。</p>
            </div>
          )}
          {(tab === 'dishes' ? matchingDishes.length : matchingIngredients.length) > limit && (
            <button className="button secondary full-width" onClick={() => setLimit((v) => v + 24)}>
              继续显示更多
            </button>
          )}
          <p className="source-note">
            食材：USDA SR Legacy
            官方公开数据。菜品分为官方熟食参考、可编辑示范配方和待填写估算；不冒充餐厅实测。点击菜品可查看配料和来源。
          </p>
        </>
      )}
    </div>
  );
}
function ReferenceDetail({ dish, onBack }: { dish: Dish; onBack: () => void }) {
  const f = dish.food!;
  return (
    <div className="recipe-detail">
      <button className="text-button" onClick={onBack}>
        <ChevronLeft size={17} />
        返回菜品目录
      </button>
      <div className="recipe-hero">
        <DishArtwork type={dish.name.includes('饭') ? 'rice' : 'noodles'} />
        <span className="eyebrow">REFERENCE DISH</span>
        <h3>{dish.name}</h3>
        <p>{dish.english}</p>
      </div>
      <div className="recipe-callout">
        <strong>{fmt(f.nutrients.calories)} kcal / 100 g</strong>
        <p>
          这是熟食样本参考，具体餐厅配料比例未知。默认份量 {dish.defaultGrams}g
          是输入起点，不是对你的餐食测量。
        </p>
      </div>
      <p className="source-note">
        {f.source} · {f.sourceId}
        <br />
        {f.sourceURL && (
          <a href={f.sourceURL} target="_blank" rel="noreferrer">
            查看参考来源
          </a>
        )}
      </p>
      <button
        className="button primary full-width"
        onClick={() =>
          void attempt(async () => {
            if (!(await db.foods.get(f.id))) await db.foods.put(f);
            useUI.getState().selectFood(f.id, dish.defaultGrams);
          })
        }
      >
        选择这个参考，确认实际份量
        <ArrowUpRight size={17} />
      </button>
    </div>
  );
}
export function RecipeDetail({ recipe, onBack }: { recipe: RecipeDish; onBack: () => void }) {
  const [parts, setParts] = useState<RecipePart[]>(recipe.parts.map((p) => ({ ...p }))),
    [yieldGrams, setYield] = useState(recipe.yieldGrams),
    [portion, setPortion] = useState(recipe.defaultGrams),
    [busy, setBusy] = useState(false);
  let food: Food | null = null;
  try {
    food = recipeFood(recipe, parts, yieldGrams);
  } catch {
    /* Keep invalid input visible until corrected. */
  }
  return (
    <form
      className="recipe-detail"
      onSubmit={(e) => {
        e.preventDefault();
        if (!food || busy) return;
        setBusy(true);
        const saved = { ...food, id: uid() };
        void attempt(async () => {
          await db.foods.put(saved);
          useUI.getState().selectFood(saved.id, portion);
        }).finally(() => setBusy(false));
      }}
    >
      <button type="button" className="text-button" onClick={onBack}>
        <ChevronLeft size={17} />
        返回菜品目录
      </button>
      <div className="recipe-hero">
        <DishArtwork
          type={
            recipe.name.includes('饭') ? 'rice' : recipe.name.includes('面') ? 'noodles' : 'hotpot'
          }
        />
        <span className="eyebrow">EDITABLE RECIPE ESTIMATE</span>
        <h3>{recipe.name}</h3>
        <p>{recipe.description}</p>
      </div>
      <p className="recipe-method">{recipe.method}</p>
      <h4>这一份配方里，有什么？</h4>
      <div className="recipe-parts">
        {parts.map((p, index) => (
          <label key={index}>
            <span>
              <strong>{ingredientByKey.get(p.key)!.food.name}</strong>
              <small>{ingredientByKey.get(p.key)!.food.sourceId}</small>
            </span>
            <input
              aria-label={ingredientByKey.get(p.key)!.food.name + '配方克数'}
              required
              type="number"
              min="0"
              max="10000"
              step=".1"
              value={p.grams}
              onChange={(e) =>
                setParts((v) =>
                  v.map((x, i) => (i === index ? { ...x, grams: Number(e.target.value) } : x)),
                )
              }
            />
            <small>g</small>
          </label>
        ))}
      </div>
      <button
        type="button"
        className="text-button"
        onClick={() => setParts([...parts, { key: 'canola-oil', grams: 5 }])}
      >
        <Plus size={16} />
        再加一项食材
      </button>
      {parts.length > recipe.parts.length && (
        <Field label="最后一项食材">
          <select
            value={parts.at(-1)!.key}
            onChange={(e) =>
              setParts(
                parts.map((p, i) => (i === parts.length - 1 ? { ...p, key: e.target.value } : p)),
              )
            }
          >
            {ingredients.map((i) => (
              <option key={i.key} value={i.key}>
                {i.food.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <div className="form-grid">
        <Field label="假设成品总重量 (g)" hint="烹调失水、加水、汤汁会改变成品重量，请按实际修改。">
          <input
            required
            type="number"
            min="1"
            max="100000"
            value={yieldGrams}
            onChange={(e) => setYield(Number(e.target.value))}
          />
        </Field>
        <Field label="本次吃下的份量 (g)">
          <input
            required
            type="number"
            min="1"
            max="10000"
            value={portion}
            onChange={(e) => setPortion(Number(e.target.value))}
          />
        </Field>
      </div>
      <div className="recipe-estimate">
        <span>当前配方估算</span>
        <strong>
          {food ? fmt((food.nutrients.calories * portion) / 100) : '—'}
          <small> kcal / 本份</small>
        </strong>
        <p>
          {food ? `${fmt(food.nutrients.calories)} kcal / 100g` : '请修正配方重量'} ·
          未知营养仍保留未知
        </p>
      </div>
      <p className="source-note">
        数值来自已列出食材加总。默认配料和成品重量只是示范，不代表餐厅实际做法。可把配料设为0排除；额外油、酱汁请补上。确认后还需在记餐表单保存，浏览配方不会自动写入饮食记录。
      </p>
      <button disabled={busy || !food} className="button primary full-width">
        <Check size={17} />
        采用此配方，继续确认记录
      </button>
    </form>
  );
}
