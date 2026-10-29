import {
  Utensils,
  Plus,
  Copy,
  Bookmark,
  Flame,
  Sun,
  Sunrise,
  Moon,
  Coffee,
  CircleDot,
} from 'lucide-react';
import type { Entry, Preferences, Template } from '../lib/types';
import { totals, fmt, shiftDay, uid } from '../lib/domain';
import { useUI, attempt } from '../lib/store';
import { db, repository } from '../lib/db';
import { Card, Section, Empty, Progress, number } from '../components/ui';
import { EntryList } from './Today';
export function Nutrition({
  entries,
  profile,
  templates,
}: {
  entries: Entry[];
  profile: Preferences;
  templates: Template[];
}) {
  const { day, open, notify } = useUI();
  const meals = entries.filter((e) => e.date === day && e.kind === 'meal');
  const n = totals(meals);
  const copyYesterday = () =>
    attempt(async () => {
      const prev = entries.filter((e) => e.kind === 'meal' && e.date === shiftDay(day, -1));
      if (!prev.length) throw Error('昨天还没有饮食记录。先记录一餐吧。');
      await db.transaction('rw', db.entries, async () => {
        for (const e of prev)
          await repository.save({
            ...e,
            id: uid(),
            date: day,
            createdAt: new Date().toISOString(),
          });
      });
      notify(`已复制昨天 ${prev.length} 项食物`);
    });
  return (
    <>
      <div className="page-intro">
        <span className="page-symbol peach">
          <Utensils size={24} />
        </span>
        <div>
          <h2>吃得明白，吃得自在。</h2>
          <p>记录真实的一餐，找到适合自己的节奏。</p>
        </div>
        <button className="button primary" onClick={() => open('meal')}>
          <Plus size={18} />
          添加食物
        </button>
      </div>
      <div className="nutrition-discovery">
        <button className="card discovery-item" onClick={() => open('dishes')}>
          <Utensils size={23} />
          <span>
            <strong>今天，吃哪一道？</strong>
            <small>菜品＋食材＋中马30款饮料</small>
          </span>
          <Plus size={18} />
        </button>
        <button className="card discovery-item" onClick={() => open('photo-food')}>
          <Sun size={23} />
          <span>
            <strong>拍下这一餐</strong>
            <small>设备内辅助识别，确认份量后记录</small>
          </span>
          <Plus size={18} />
        </button>
        <button className="card discovery-item" onClick={() => open('sugar')}>
          <Coffee size={23} />
          <span>
            <strong>看见每一瓶饮料的糖</strong>
            <small>看糖块落下，再做一次选择</small>
          </span>
          <Plus size={18} />
        </button>
      </div>
      <div className="nutrition-layout">
        <Card className="nutrition-summary">
          <span className="muted">今日饮食能量</span>
          <div className="big-number">
            {meals.length ? fmt(n.calories) : '—'}
            <span>kcal</span>
          </div>
          <Progress value={n.calories} target={profile.calories} label="热量" />
          <p className="muted text-sm">
            目标 {fmt(profile.calories)} kcal · {meals.length} 项食物
          </p>
          <div className="nutrient-list">
            {(
              [
                ['蛋白质', n.protein, 'g'],
                ['碳水化合物', n.carbs, 'g'],
                ['脂肪', n.fat, 'g'],
                ['膳食纤维', n.fiber, 'g'],
                ['糖', n.sugar, 'g'],
                ['钠', n.sodium, 'mg'],
                ['饱和脂肪', n.saturatedFat, 'g'],
                ['咖啡因', n.caffeine, 'mg'],
              ] as const
            ).map(([label, v, u]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>
                  {number(v, 1)} <small>{u}</small>
                </strong>
              </div>
            ))}
          </div>
          <p className="footnote">
            「—」代表未记录或营养数据不完整，不代表零。通用食物数据仅供参考。
          </p>
        </Card>
        <div>
          <div className="toolbar">
            <button className="button secondary" onClick={copyYesterday}>
              <Copy size={16} />
              复制昨天
            </button>
            <button className="button secondary" onClick={() => open('templates')}>
              <Bookmark size={16} />
              餐食模板 {templates.filter((t) => t.kind === 'meal').length || ''}
            </button>
          </div>
          {['早餐', '午餐', '晚餐', '加餐', '其他'].map((meal, i) => {
            const list = meals.filter((e) => (e.meal ?? '其他') === meal);
            return (
              <Card className="meal-card" key={meal}>
                <div className="section-heading">
                  <div className="flex items-center gap-3">
                    <span className="meal-marker">
                      {(() => {
                        const Icon = [Sunrise, Sun, Moon, Coffee, CircleDot][i];
                        return <Icon size={21} />;
                      })()}
                    </span>
                    <h3>{meal}</h3>
                    <span className="muted text-sm">
                      {list.length ? fmt(totals(list).calories) + ' kcal' : '尚未记录'}
                    </span>
                  </div>
                  <button
                    className="icon-button"
                    aria-label={'添加' + meal}
                    onClick={() => {
                      open('meal');
                      sessionStorage.setItem('vital-meal', meal);
                    }}
                  >
                    <Plus size={20} />
                  </button>
                </div>
                {list.length > 0 && <EntryList entries={list} />}
              </Card>
            );
          })}
          <Card className="note-card">
            <Flame size={18} />
            <p>食物的意义，远不止数字。这里记录营养，也给享受食物留出空间。</p>
          </Card>
        </div>
      </div>
    </>
  );
}
