import { useState } from 'react';
import {
  Download,
  Upload,
  ShieldCheck,
  Smartphone,
  Share,
  Plus,
  Check,
  FileJson,
  FileSpreadsheet,
  Bookmark,
  Trash2,
} from 'lucide-react';
import type { Backup, Preferences, Template } from '../lib/types';
import { repository, download, db } from '../lib/db';
import { dayKey, csv, validateBackup, uid } from '../lib/domain';
import { useUI, attempt } from '../lib/store';
import { Field, Empty } from '../components/ui';
export function GoalsForm({ profile }: { profile: Preferences }) {
  const [p, setP] = useState({ ...profile }),
    [busy, setBusy] = useState(false);
  const { close } = useUI();
  const [habits, setHabits] = useState(p.habits.join('\n')),
    [water, setWater] = useState(p.waterShortcuts.join(','));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        void attempt(async () => {
          const shortcuts = water.split(/[,，]/).map(Number);
          if (
            shortcuts.some((n) => !Number.isFinite(n) || n < 1 || n > 10000) ||
            !shortcuts.length ||
            shortcuts.length > 6
          )
            throw Error('请填写 1–6 个有效饮水快捷量，用逗号分隔（1–10000 ml）');
          await repository.profile({
            ...p,
            habits: habits
              .split('\n')
              .map((x) => x.trim())
              .filter(Boolean)
              .slice(0, 20),
            waterShortcuts: shortcuts,
          });
          close();
        }, '个人目标已更新').finally(() => setBusy(false));
      }}
    >
      <p className="muted text-sm">
        初始目标仅为可编辑的起点，不是个人医疗或营养建议。按自己的情况调整。
      </p>
      <div className="form-grid">
        <Field label="怎么称呼你">
          <input
            maxLength={30}
            value={p.name}
            onChange={(e) => setP({ ...p, name: e.target.value })}
          />
        </Field>
        <Field label="偏好单位">
          <select
            value={p.units}
            onChange={(e) => setP({ ...p, units: e.target.value as Preferences['units'] })}
          >
            <option value="metric">公制 kg / cm</option>
            <option value="imperial">英制 lb / in</option>
          </select>
        </Field>
        {(
          [
            ['height', '身高 (cm)', 80, 250],
            ['weightGoal', '体重目标 (kg)', 20, 500],
            ['calories', '每日热量 (kcal)', 100, 10000],
            ['protein', '蛋白质 (g)', 1, 500],
            ['carbs', '碳水 (g)', 1, 1000],
            ['fat', '脂肪 (g)', 1, 500],
            ['water', '每日饮水 (ml)', 100, 10000],
            ['sleep', '睡眠目标 (小时)', 1, 16],
            ['workouts', '每周运动 (次)', 1, 21],
          ] as const
        ).map(([k, l, min, max]) => (
          <Field key={k} label={l}>
            <input
              required
              type="number"
              step={k === 'sleep' || k === 'height' || k === 'weightGoal' ? '.1' : '1'}
              min={min}
              max={max}
              value={p[k]}
              onChange={(e) => setP({ ...p, [k]: Number(e.target.value) })}
            />
          </Field>
        ))}
      </div>
      <Field label="饮水快捷量 (ml)，用逗号分隔">
        <input required value={water} onChange={(e) => setWater(e.target.value)} />
      </Field>
      <Field label="习惯列表，每行一项">
        <textarea
          rows={3}
          maxLength={1000}
          value={habits}
          onChange={(e) => setHabits(e.target.value)}
        />
      </Field>
      <button disabled={busy} className="button primary full-width">
        <Check size={17} />
        保存个人目标
      </button>
    </form>
  );
}
export function BackupForm({ profile }: { profile: Preferences }) {
  const [pending, setPending] = useState<Backup | null>(null),
    [mode, setMode] = useState<'merge' | 'replace'>('merge'),
    [busy, setBusy] = useState(false);
  const { notify } = useUI();
  async function exportJSON() {
    setBusy(true);
    await attempt(async () => {
      const b = await repository.export();
      download(JSON.stringify(b, null, 2), `WHIP-backup-${dayKey()}.json`);
      await repository.profile({ ...profile, lastBackup: new Date().toISOString() });
      notify('备份文件已交给浏览器，请确认文件已保存');
    });
    setBusy(false);
  }
  async function read(file?: File) {
    if (!file) return;
    await attempt(async () => {
      if (file.size > 100000000) throw Error('备份文件超过 100 MB，请使用较小的备份');
      const raw = JSON.parse(await file.text());
      setPending(validateBackup(raw));
    });
  }
  return (
    <>
      <div className="callout">
        <ShieldCheck size={22} />
        <p>
          这是你的数据安全网。浏览器数据可能被清理；建议每周备份一次，并在换设备前备份。导出文件包含照片与
          GPS 坐标。
        </p>
      </div>
      <button className="backup-option" disabled={busy} onClick={exportJSON}>
        <span className="icon-box mint">
          <FileJson size={24} />
        </span>
        <span>
          <strong>导出完整 JSON 备份</strong>
          <small>全部记录、照片、路线、食物、模板与目标</small>
        </span>
        <Download size={20} />
      </button>
      <button
        className="backup-option"
        onClick={() =>
          attempt(async () => {
            download(
              csv(await db.entries.toArray()),
              `WHIP-records-${dayKey()}.csv`,
              'text/csv;charset=utf-8',
            );
          }, 'CSV 已交给浏览器下载')
        }
      >
        <span className="icon-box blue">
          <FileSpreadsheet size={24} />
        </span>
        <span>
          <strong>导出 CSV 表格</strong>
          <small>通用记录摘要，不含照片和路线点</small>
        </span>
        <Download size={20} />
      </button>
      <Field label="从 JSON 备份恢复">
        <input
          type="file"
          accept="application/json,.json"
          onChange={(e) => read(e.target.files?.[0])}
        />
      </Field>
      {pending && (
        <div className="import-preview">
          <h3>已校验备份</h3>
          <p>
            {pending.entries.length} 条记录 · {pending.foods.length} 个食物 ·{' '}
            {pending.templates.length} 个模板
            <br />
            导出时间：{new Date(pending.exportedAt).toLocaleString()}
          </p>
          <Field label="恢复方式">
            <select value={mode} onChange={(e) => setMode(e.target.value as 'merge' | 'replace')}>
              <option value="merge">安全合并：重复 ID 跳过，保留当前设置</option>
              <option value="replace">完整替换：删除当前记录与设置，再恢复</option>
            </select>
          </Field>
          <button
            disabled={busy}
            className={'button full-width ' + (mode === 'replace' ? 'destructive' : 'primary')}
            onClick={() => {
              if (
                !confirm(
                  mode === 'replace'
                    ? '确认永久替换当前设备的全部数据？建议先导出当前备份。'
                    : '确认合并这份备份？相同 ID 的记录不会覆盖。',
                )
              )
                return;
              setBusy(true);
              void attempt(async () => {
                const count = await repository.import(pending, mode);
                setPending(null);
                notify(`恢复完成：导入 ${count} 条新记录，重复项已跳过`);
              }).finally(() => setBusy(false));
            }}
          >
            <Upload size={17} />
            {busy ? '恢复中…' : '确认恢复'}
          </button>
        </div>
      )}
      <p className="footnote">
        JSON 是可恢复的完整备份。CSV 仅供分析。所有导入先校验，并在单个 IndexedDB
        事务中执行；错误不会留下半份数据。
      </p>
    </>
  );
}
export function InstallGuide() {
  return (
    <>
      <div className="callout">
        <strong>电脑上，像 App 一样打开</strong>
        <p>
          macOS Safari：打开正式网址 →「文件」→「添加到程序坞」。Chrome /
          Edge：使用地址栏的安装按钮，或菜单中的安装选项。也可以打开桌面的 WHIP 网址快捷方式。
        </p>
        <p>
          源码和静态网页压缩包用于备份或部署；不要直接双击 index.html 运行，离线储存与 PWA 需要
          HTTPS 或本机服务器。
        </p>
      </div>
      <div className="install-hero">
        <span className="app-icon">
          v<span>•</span>
        </span>
        <h3>把 WHIP 放进口袋</h3>
        <p>无需 App Store，无需开发者签名，没有定期重签。</p>
      </div>
      <ol className="install-steps">
        <li>
          <span>1</span>
          <div>
            <strong>用 iPhone Safari 打开正式 HTTPS 网址</strong>
            <p>本机 localhost 只供开发预览；手机安装需要公开 HTTPS 静态托管网址。</p>
          </div>
        </li>
        <li>
          <span>2</span>
          <div>
            <strong>
              点击分享 <Share size={15} /> → 添加到主屏幕
            </strong>
            <p>确认名称为 WHIP，再点「添加」。如果显示「作为 Web App 打开」，请启用。</p>
          </div>
        </li>
        <li>
          <span>3</span>
          <div>
            <strong>从主屏幕打开一次，等待离线就绪</strong>
            <p>资源缓存完成后，基础记录可离线使用。首次安装需联网。</p>
          </div>
        </li>
      </ol>
      <div className="callout">
        <p>
          免费长期使用的推荐部署：Cloudflare Pages 或 GitHub Pages
          静态托管。项目不依赖个人电脑常开。不同网址、浏览器和主屏幕安装可能有独立储存；迁移前请导出
          JSON。
        </p>
      </div>
    </>
  );
}
export function TemplatesForm({ templates }: { templates: Template[] }) {
  const { day, notify } = useUI();
  return (
    <>
      {templates.filter((t) => t.kind === 'meal').length ? (
        templates
          .filter((t) => t.kind === 'meal')
          .map((t) => (
            <div className="template-row" key={t.id}>
              <Bookmark size={20} />
              <span>
                <strong>{t.name}</strong>
                <small>{t.entries.length} 项食物</small>
              </span>
              <button
                className="icon-button"
                aria-label={'添加模板' + t.name}
                onClick={() =>
                  attempt(async () => {
                    await db.transaction('rw', db.entries, async () => {
                      for (const e of t.entries)
                        await repository.save({
                          ...e,
                          id: uid(),
                          date: day,
                          createdAt: new Date().toISOString(),
                        });
                    });
                    notify('已添加到所选日期');
                  })
                }
              >
                <Plus size={20} />
              </button>
              <button
                className="icon-button danger"
                aria-label={'删除模板' + t.name}
                onClick={() => {
                  if (confirm('删除此模板？')) void attempt(() => db.templates.delete(t.id));
                }}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))
      ) : (
        <Empty
          icon={<Bookmark size={28} />}
          title="把常吃的，变成快捷选项"
          body="打开一条饮食记录，点击「存为模板」。也可以在下方保存当天全部餐食。"
        />
      )}
      <button
        className="button secondary full-width"
        onClick={() => {
          const name = prompt('给这份餐食模板起个名字：');
          if (!name?.trim()) return;
          void attempt(async () => {
            const entries = await db.entries
              .where('date')
              .equals(day)
              .filter((e) => e.kind === 'meal')
              .toArray();
            if (!entries.length) throw Error('所选日期还没有饮食记录');
            await db.templates.put({
              id: uid(),
              name: name.trim(),
              kind: 'meal',
              entries,
              createdAt: new Date().toISOString(),
            });
          }, '当天餐食已保存为模板');
        }}
      >
        <Plus size={16} />
        保存当天餐食为模板
      </button>
    </>
  );
}
