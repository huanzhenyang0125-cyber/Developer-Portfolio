import { useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { drinks, type Drink } from '../lib/drinks';
import { fmt } from '../lib/domain';
export function DrinkArtwork({ category }: { category: string }) {
  return (
    <svg viewBox="0 0 80 100" fill="none" aria-hidden="true">
      {category === '茶饮' || category === '咖啡' || category === '乳与麦芽饮' ? (
        <>
          <path d="M18 24h44l-6 62H24l-6-62Z" fill="currentColor" opacity=".07" />
          <path
            d="M18 24h44l-6 62H24l-6-62Zm-3 0h50m-44-6h38M42 18l7-11"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path d="M23 47h34v23H23Z" fill="currentColor" opacity=".1" />
          <path
            d="M33 54h14m-12 6h10"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <path
            d="M28 12h24v17l8 13v41c0 8-40 8-40 0V42l8-13V12Z"
            fill="currentColor"
            opacity=".06"
          />
          <path
            d="M28 12h24v17l8 13v41c0 8-40 8-40 0V42l8-13V12Zm-1 0h26m-24 7h22M22 49h36m-36 24h36"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M30 58h20m-16 6h12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
export function DrinkPicker({
  onSelect,
  selectedId,
  compact = false,
}: {
  onSelect: (d: Drink) => void;
  selectedId?: string;
  compact?: boolean;
}) {
  const [query, setQuery] = useState(''),
    [market, setMarket] = useState('全部地区'),
    [category, setCategory] = useState('全部');
  const list = drinks.filter(
    (d) =>
      (market === '全部地区' || d.market === market) &&
      (category === '全部' || d.category === category) &&
      (d.name + d.brand + d.category + d.market).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className={'drink-picker ' + (compact ? 'compact' : '')}>
      <div className="search-field">
        <Search size={18} />
        <input
          aria-label="搜索30款饮料"
          placeholder="品牌、茶饮、麦芽饮、气泡水…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="pills">
        {['全部地区', '马来西亚', '中国大陆'].map((m) => (
          <button key={m} className={market === m ? 'selected' : ''} onClick={() => setMarket(m)}>
            {m}
          </button>
        ))}
      </div>
      {!compact && (
        <div className="catalog-filters">
          {['全部', ...new Set(drinks.map((d) => d.category))].map((c) => (
            <button
              key={c}
              className={category === c ? 'selected' : ''}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <div className="drink-grid">
        {list.map((d) => (
          <button
            className={'drink-card ' + (selectedId === d.id ? 'selected' : '')}
            key={d.id}
            onClick={() => onSelect(d)}
          >
            <span className="drink-picture">
              <DrinkArtwork category={d.category} />
            </span>
            <span className="drink-copy">
              <small>
                {d.market} · {d.category}
              </small>
              <strong>{d.name}</strong>
              <span>
                {d.sugarPer100 == null
                  ? '糖量待核对包装'
                  : `${fmt(d.sugarPer100, 2)} g 糖 / 100 ml`}
              </span>
            </span>
            <ChevronRight size={15} />
          </button>
        ))}
      </div>
      {!list.length && (
        <div className="empty">
          <p>没有匹配的饮料，试试品牌或切换地区。</p>
        </div>
      )}
      <p className="source-note">
        30 款常见产品目录，不是销量排名。同名产品不同地区可有不同配方。0
        仅按官方零糖声明；未知不是零。容量可编辑，以手中包装为准。
      </p>
    </div>
  );
}
