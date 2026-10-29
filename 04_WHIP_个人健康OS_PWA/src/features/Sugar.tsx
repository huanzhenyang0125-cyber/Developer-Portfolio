import { useState, useRef, useEffect } from 'react';
import { Check, ArrowUpRight, RotateCcw, CupSoda, ChevronDown, Utensils } from 'lucide-react';
import { Field } from '../components/ui';
import { sugarAmount, sugarCubes } from '../lib/protocol';
import { fmt, makeEntry, uid } from '../lib/domain';
import { repository, db } from '../lib/db';
import { useUI } from '../lib/store';
import { drinks, drinkById, drinkSource, type Drink } from '../lib/drinks';
import { DrinkPicker, DrinkArtwork } from './DrinkLibrary';
import type { Food } from '../lib/types';
export function SugarLab() {
  const selection = useUI((s) => s.drinkSelection);
  const initial =
    drinkById.get(selection ?? '') ?? drinks.find((d) => d.id === 'my-redbull-blue-silver')!;
  const [drink, setDrink] = useState<Drink>(initial),
    [ml, setMl] = useState(initial.defaultMl),
    [sugar, setSugar] = useState(initial.sugarPer100?.toString() ?? ''),
    [calories, setCalories] = useState(initial.kcalPer100?.toString() ?? ''),
    [name, setName] = useState(initial.name),
    [source, setSource] = useState(drinkSource(initial)),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [picker, setPicker] = useState(false),
    [labelOpen, setLabelOpen] = useState(initial.sugarPer100 == null),
    [view, setView] = useState<'drop' | 'balance'>('drop'),
    [replay, setReplay] = useState(0);
  const lock = useRef(false);
  const validCalories =
    calories !== '' &&
    Number.isFinite(Number(calories)) &&
    Number(calories) >= 0 &&
    Number(calories) <= 1000;
  const total = sugar === '' ? null : sugarAmount(ml, Number(sugar));
  const cubes = total == null ? null : sugarCubes(total);
  function choose(d: Drink) {
    setDrink(d);
    setLabelOpen(d.sugarPer100 == null);
    setMl(d.defaultMl);
    setSugar(d.sugarPer100?.toString() ?? '');
    setCalories(d.kcalPer100?.toString() ?? '');
    setName(d.name);
    setSource(drinkSource(d));
    setConfirm(false);
    setPicker(false);
    setReplay((v) => v + 1);
  }
  async function save(resisted: boolean) {
    if (lock.current || (!resisted && total === 0)) return;
    lock.current = true;
    setBusy(true);
    try {
      const entry = {
        ...makeEntry('protocol', resisted ? `抵抗诱惑：没有喝${name}` : name),
        eventType: resisted ? ('resisted' as const) : ('sugary-drink' as const),
        occurredAt: new Date().toISOString(),
        amount: resisted ? undefined : ml,
        unit: resisted ? undefined : 'ml',
        sugarGrams: resisted ? undefined : (total ?? undefined),
        sugarPer100: resisted || sugar === '' ? undefined : Number(sugar),
        sugarSource: source,
        notes: resisted
          ? `没有饮用。对比情景：${ml} ml；${total == null ? '糖含量未知' : `约 ${fmt(total, 1)} g 糖`}。未计入实际摄入。`
          : '本条为自律事件；未自动加入饮食热量。',
      };
      await repository.save(entry);
      useUI.getState().close();
      if (resisted) useUI.getState().notify('这次，你说停就停。抵抗已记录，继续执行。');
      else useUI.setState({ flagged: entry });
    } catch (e) {
      useUI.getState().fail(e);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function diary() {
    if (!validCalories || lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const food: Food = {
        id: uid(),
        name: name.trim(),
        english: drink.brand + ' · ' + drink.market,
        aliases: name + ' ' + drink.brand,
        basis: 'ml',
        quality: 'label',
        source,
        sourceURL: drink.sourceUrl,
        sourceId: drink.id + ' / 包装或官网对照',
        retrievedAt: '2026-10-23',
        nutrients: {
          calories: Number(calories),
          protein: null,
          carbs: null,
          fat: null,
          sugar: sugar === '' ? null : Number(sugar),
        },
        servings: [],
      };
      await db.foods.put(food);
      useUI.getState().selectFood(food.id, ml);
    } catch (e) {
      useUI.getState().fail(e);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="sugar-lab sugar-lab-v2">
      <div className="sugar-title">
        <span className="eyebrow">WHIP · SEE WHAT YOU DRINK</span>
        <h3>别让糖，偷偷滑过去。</h3>
        <p>看它一块块落下，再决定要不要喝。</p>
      </div>
      <button className="selected-drink" aria-expanded={picker} onClick={() => setPicker(!picker)}>
        <span className="selected-drink-icon">
          <DrinkArtwork category={drink.category} />
        </span>
        <span>
          <small>
            {drink.market} · {drink.category}
          </small>
          <strong>{name}</strong>
          <em>
            {drink.sugarPer100 == null
              ? '原始糖量待核对包装'
              : `官网参考 ${fmt(drink.sugarPer100, 2)} g 糖 / 100ml`}
          </em>
        </span>
        <span className="drink-switch">
          换饮料 · 30款
          <ChevronDown size={15} />
        </span>
      </button>
      {picker && (
        <div className="sugar-drink-list">
          <DrinkPicker compact selectedId={drink.id} onSelect={choose} />
        </div>
      )}
      <div className="sugar-view-toggle">
        <div className="pills">
          <button className={view === 'drop' ? 'selected' : ''} onClick={() => setView('drop')}>
            糖块掉落
          </button>
          <button
            className={view === 'balance' ? 'selected' : ''}
            onClick={() => setView('balance')}
          >
            天平对比
          </button>
        </div>
        <button className="text-button" onClick={() => setReplay((v) => v + 1)}>
          <RotateCcw size={15} />
          重播
        </button>
      </div>
      {view === 'drop' ? (
        <SugarRain key={`${drink.id}-${ml}-${sugar}-${replay}`} grams={total} />
      ) : (
        <SugarScale key={replay} grams={total} />
      )}
      <div className="sugar-readout">
        <div>
          <span>当前容量 · {ml} ml</span>
          <strong>
            {total == null ? '—' : fmt(total, 1)}
            <small> g 糖</small>
          </strong>
        </div>
        <span className="sugar-equal">≈</span>
        <div>
          <span>展示单位 · 每块 4 g</span>
          <strong>
            {cubes == null ? '—' : fmt(cubes, 2)}
            <small> 块方糖</small>
          </strong>
        </div>
      </div>
      <div className="pills sugar-presets">
        {[...new Set([250, 330, 500, ...drink.packSizesMl])].slice(0, 6).map((v) => (
          <button
            key={v}
            className={ml === v ? 'selected' : ''}
            onClick={() => {
              setMl(v);
              setConfirm(false);
            }}
          >
            {v} ml
          </button>
        ))}
      </div>
      <p className="portion-hint">容量按钮是可改的比较份量；具体包装以手中饮料为准。</p>
      <details
        className="drink-label-fields"
        open={labelOpen}
        onToggle={(e) => setLabelOpen(e.currentTarget.open)}
      >
        <summary>核对包装与实际容量</summary>
        <div className="form-grid">
          <Field label="饮料名称">
            <input
              required
              maxLength={80}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSugar('');
                setCalories('');
                setSource('包装标签 · 用户自行填写');
                setConfirm(false);
              }}
            />
          </Field>
          <Field label="实际容量 (ml)">
            <input
              required
              type="number"
              min="1"
              max="3000"
              value={ml}
              onChange={(e) => {
                setMl(Math.min(3000, Math.max(1, Number(e.target.value))));
                setConfirm(false);
              }}
            />
          </Field>
          <Field label="包装每 100ml 糖 (g)">
            <input
              type="number"
              min="0"
              max="100"
              step=".01"
              value={sugar}
              onChange={(e) => {
                setSugar(
                  e.target.value === ''
                    ? ''
                    : String(Math.min(100, Math.max(0, Number(e.target.value)))),
                );
                setSource('包装标签 · 用户自行填写');
                setConfirm(false);
              }}
              placeholder="未知请留空，不填0"
            />
          </Field>
          <Field label="包装每 100ml 能量 (kcal)">
            <input
              type="number"
              min="0"
              max="1000"
              step=".01"
              value={calories}
              onChange={(e) => {
                setCalories(e.target.value);
                setSource('包装标签 · 用户自行填写');
              }}
              placeholder="记录饮食前需核对能量"
            />
          </Field>
        </div>
        <Field label="数据来源">
          <input maxLength={500} value={source} onChange={(e) => setSource(e.target.value)} />
        </Field>
      </details>
      <div className="drink-provenance">
        <span className="tag">{drink.market}</span>
        <a href={drink.sourceUrl} target="_blank" rel="noreferrer">
          官方产品与营养来源
          <ArrowUpRight size={12} />
        </a>
        <p>{drink.note}</p>
        <p>
          总糖包含天然存在的糖，不等于添加糖。零按官方声明；未知不记为零。动画只表示比较情景，不代表已经喝下或已经少喝。
        </p>
      </div>
      {total === 0 ? (
        <div className="zero-sugar-note">
          <Check size={18} />
          <p>该标签标示零糖，不制造含糖饮料红旗。其他营养仍按实际标签记录。</p>
        </div>
      ) : (
        <p className="coach-inline">
          {total == null
            ? '别拿未知当作零。先把包装上的糖量看清楚。'
            : `这 ${fmt(total, 1)} 克糖不会因为你不看，就消失。现在由你决定。`}
        </p>
      )}
      <div className="sugar-diary-action">
        <button
          disabled={busy || !validCalories || !name.trim()}
          className="button secondary full-width"
          onClick={diary}
        >
          <Utensils size={17} />
          按标签记录饮食热量
        </button>
        {!validCalories && <small>请核对包装能量，填写 0–1000 kcal / 100ml。</small>}
      </div>
      <button
        disabled={busy || !name.trim()}
        className="button primary full-width"
        onClick={() => save(true)}
      >
        <Check size={18} />
        这次不喝，记录成功抵抗
      </button>
      {total !== 0 &&
        (!confirm ? (
          <button className="text-button full-width" onClick={() => setConfirm(true)}>
            我已经喝了，准备如实记录
            <ArrowUpRight size={15} />
          </button>
        ) : (
          <div className="sugar-confirm">
            <p>
              确认已喝下 {ml} ml {name}？
              {total == null ? '你确认这是含糖饮料，但糖量尚不清楚。' : ''}
              保存后显示红旗提醒；本条不自动写入饮食热量。
            </p>
            <button
              disabled={busy || !name.trim()}
              className="button danger-button full-width"
              onClick={() => save(false)}
            >
              确认已喝，并保存事件
            </button>
            <button className="text-button" onClick={() => setConfirm(false)}>
              返回重新选择
            </button>
          </div>
        ))}
    </div>
  );
}
export function SugarRain({ grams }: { grams: number | null }) {
  const actual = grams == null ? null : grams / 4,
    count = actual == null ? 0 : Math.min(48, Math.ceil(actual));
  const [landed, setLanded] = useState(0),
    [reduced, setReduced] = useState(
      () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)'),
      change = () => setReduced(mq.matches);
    mq.addEventListener('change', change);
    return () => mq.removeEventListener('change', change);
  }, []);
  const done = reduced ? count : landed;
  return (
    <div
      className={'sugar-rain ' + (reduced ? 'static' : '')}
      role="img"
      aria-label={
        grams == null
          ? '糖量未知，等待包装标签'
          : `糖块掉落动画：${fmt(grams, 2)}克糖，约${fmt(actual!, 2)}块4克展示方糖`
      }
    >
      <div className="rain-light" />
      <div className="rain-caption">
        <span>
          {grams == null
            ? '等待标签'
            : grams === 0
              ? '标示零糖'
              : done < count
                ? '看清楚，它正在落下。'
                : '这些糖，现在看得见。'}
        </span>
        <small>{grams == null ? '未知 ≠ 零' : `每块 4g · ${fmt(grams, 2)}g 总糖`}</small>
      </div>
      <div className="rain-source">
        <span>糖</span>
        <i />
      </div>
      <div className="cube-stage">
        {Array.from({ length: count }, (_, i) => {
          const row = Math.floor(i / 8),
            col = i % 8,
            fraction = Math.min(1, actual! - i);
          return (
            <div
              key={i}
              className="falling-cube-wrap"
              onAnimationEnd={(e) => {
                if (e.target === e.currentTarget) setLanded((n) => Math.min(count, n + 1));
              }}
              style={{
                left: `${16 + col * 8.5}%`,
                bottom: `${26 + row * 23}px`,
                animationDelay: `${i * 75}ms`,
                zIndex: 10 + row,
                opacity: fraction < 1 ? 0.55 : 1,
              }}
            >
              <div
                className="falling-cube"
                style={{ transform: `rotate(${((i % 5) - 2) * 5}deg)` }}
              >
                <span className="cube-front" />
                <span className="cube-top" />
                <span className="cube-side" />
                {fraction < 1 && <small>{fmt(fraction * 4, 2)}g</small>}
              </div>
              <span className="cube-impact" />
            </div>
          );
        })}
        <div className="sugar-tray">
          <span />
          <i />
        </div>
      </div>
      {grams == null && (
        <div className="rain-empty">
          填写这瓶饮料的糖标签
          <br />
          <small>不套用其他地区的同名配方</small>
        </div>
      )}
      {grams === 0 && (
        <div className="rain-empty zero">
          <Check size={36} />
          <small>按官方零糖声明展示</small>
        </div>
      )}
      <div className="rain-footer">
        <span>
          {count === 0
            ? '没有绘制假方糖'
            : done < count
              ? `已落下 ${done} 块`
              : `${Math.floor(actual!)} 块${actual! % 1 > 0 ? ' + 部分方糖' : ''}`}
        </span>
        <small>
          {actual != null && actual > 48
            ? '仅逐块绘制前48块，总量完整计算'
            : '有限掉落 · 不自动记入摄入'}
        </small>
      </div>
    </div>
  );
}
export function SugarScale({ grams }: { grams: number | null }) {
  const count = grams == null ? 0 : Math.min(36, Math.ceil(grams / 4));
  const angle = grams == null ? 0 : Math.min(7, grams / 10);
  return (
    <div
      className="sugar-scale"
      role="img"
      aria-label={
        grams == null
          ? '糖量未知的天平'
          : `天平对比：约 ${fmt(grams, 1)} 克糖，相当于 ${fmt(grams / 4, 1)} 块四克展示方糖`
      }
    >
      <svg viewBox="0 0 520 230" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="cube" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="white" />
            <stop offset="1" stopColor="#d8e5f4" />
          </linearGradient>
          <linearGradient id="bottle" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#e9f3ff" />
            <stop offset="1" stopColor="#b7d8fa" />
          </linearGradient>
        </defs>
        <ellipse cx="260" cy="211" rx="188" ry="12" fill="#0071e3" opacity=".035" />
        <path
          d="M260 64v130m-48 15h96m-34-15h-28l-8 15h44l-8-15Z"
          stroke="#a5afbc"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <g
          className="balance-beam"
          style={{ transform: `rotate(${angle}deg)`, transformOrigin: '260px 65px' }}
        >
          <path d="m108 76 304-20" stroke="#7d91aa" strokeWidth="3" strokeLinecap="round" />
          <path
            d="m108 76-43 101m43-101 43 101m261-121-43 121m43-121 43 121"
            stroke="#c1cbd7"
            strokeWidth="1.5"
          />
          <path
            d="M61 177c2 11 92 11 94 0H61Zm304 0c2 11 92 11 94 0h-94Z"
            fill="#e2e9f1"
            stroke="#a5afbc"
          />
          <g className="cola-bottle">
            <path
              d="M98 90h20v16l7 15v45c0 5-34 5-34 0v-45l7-15V90Z"
              fill="url(#bottle)"
              stroke="#0071e3"
              strokeWidth="1.5"
            />
            <rect x="97" y="86" width="22" height="6" rx="2" fill="#0071e3" />
            <path d="M92 133h32v22H92Z" fill="#0071e3" opacity=".9" />
            <path d="M100 143h16m-12 5h8" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
          </g>
          <g className="sugar-cube-pile">
            {Array.from({ length: count }, (_, i) => {
              const col = i % 6,
                row = Math.floor(i / 6),
                x = 374 + col * 12,
                y = 163 - row * 12;
              const fraction = grams == null ? 0 : Math.min(1, grams / 4 - i);
              return (
                <g
                  className="sugar-cube"
                  key={i}
                  style={{
                    animationDelay: `${Math.min(i * 22, 600)}ms`,
                    opacity: Math.max(0.25, fraction),
                  }}
                >
                  <rect
                    x={x}
                    y={y}
                    width="11"
                    height="11"
                    rx="2"
                    fill="url(#cube)"
                    stroke="#8db4dc"
                    strokeWidth=".8"
                  />
                  <path d={`M${x + 2} ${y + 3}h6`} stroke="white" />
                </g>
              );
            })}
          </g>
        </g>
        <circle cx="260" cy="65" r="8" fill="#0071e3" stroke="white" strokeWidth="4" />
        <text x="108" y="222" textAnchor="middle" fill="#6e6e73" fontSize="12">
          一瓶饮料
        </text>
        <text x="411" y="222" textAnchor="middle" fill="#6e6e73" fontSize="12">
          {grams == null ? '等待标签' : grams > 144 ? '展示前 36 块 + 其余重量' : '等量展示方糖'}
        </text>
      </svg>
    </div>
  );
}
