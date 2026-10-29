import { useState } from 'react';
import {
  Search,
  ArrowUpRight,
  Plus,
  Utensils,
  Footprints,
  Scale,
  Moon,
  UserRound,
  ChartNoAxesCombined,
} from 'lucide-react';
import type { Entry } from '../lib/types';
import { useUI, type Tab } from '../lib/store';
import { kindInfo } from './Today';
const pages: { name: string; tab: Tab; Icon: typeof Search }[] = [
  { name: '今日生活', tab: 'today', Icon: Plus },
  { name: '饮食与营养', tab: 'nutrition', Icon: Utensils },
  { name: '篮球、羽毛球与训练', tab: 'activity', Icon: Footprints },
  { name: '历史趋势', tab: 'trends', Icon: ChartNoAxesCombined },
  { name: '个人资料与设置', tab: 'profile', Icon: UserRound },
];
export function GlobalSearch({ entries }: { entries: Entry[] }) {
  const [query, setQuery] = useState('');
  const { close, setTab, setDay, open } = useUI();
  const results = entries
    .filter((e) =>
      (e.name + ' ' + e.notes + ' ' + e.date).toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12);
  return (
    <div className="global-search">
      <div className="search-field">
        <Search size={19} />
        <input
          aria-label="搜索记录、页面或操作"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索记录、页面或操作…"
        />
      </div>
      <p className="search-section-label">{query ? '相关页面' : '常用入口'}</p>
      <div className="search-results">
        {pages
          .filter((p) => !query || p.name.includes(query))
          .map(({ name, tab, Icon }) => (
            <button
              key={tab}
              onClick={() => {
                close();
                setTab(tab);
              }}
            >
              <span className="icon-box">
                <Icon size={19} />
              </span>
              <span>{name}</span>
              <ArrowUpRight size={16} />
            </button>
          ))}
      </div>
      {query ? (
        <>
          <p className="search-section-label">本地记录 · 最多显示 12 条</p>
          <div className="search-results">
            {results.map((e) => {
              const Icon = kindInfo[e.kind].icon;
              return (
                <button
                  key={e.id}
                  onClick={() => {
                    setDay(e.date);
                    if (e.kind === 'workout' && e.status !== 'done') {
                      close();
                      setTab('activity');
                    } else open(e.kind, e);
                  }}
                >
                  <span className="icon-box">
                    <Icon size={19} />
                  </span>
                  <span>
                    <strong>{e.name}</strong>
                    <small>
                      {e.date} · {kindInfo[e.kind].label}
                    </small>
                  </span>
                  <ArrowUpRight size={16} />
                </button>
              );
            })}
            {!results.length && (
              <div className="empty">
                <p>没有找到这条记录。试试名称、备注或日期。</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="search-shortcuts">
          <button className="button secondary" onClick={() => open('meal')}>
            <Utensils size={17} />
            添加食物
          </button>
          <button className="button secondary" onClick={() => open('body')}>
            <Scale size={17} />
            记录体重
          </button>
          <button className="button secondary" onClick={() => open('sleep')}>
            <Moon size={17} />
            记录睡眠
          </button>
        </div>
      )}
      <p className="footnote">只在此设备中搜索，不发送搜索内容或健康数据。</p>
    </div>
  );
}
