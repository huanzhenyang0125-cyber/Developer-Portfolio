import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, ArrowUpRight, X, Timer, Check, Flag } from 'lucide-react';
import type { Entry, Preferences } from '../lib/types';
import { makeEntry, dayKey, fmt } from '../lib/domain';
import { db, repository } from '../lib/db';
import { useUI, attempt } from '../lib/store';
import { Field } from '../components/ui';
import { protocolCopy, elapsedSince, latestLapse, sugarAmount } from '../lib/protocol';
export function ProtocolSummary({ entries }: { entries: Entry[] }) {
  const open = useUI((s) => s.open),
    [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
  const last = latestLapse(entries),
    events = entries.filter((e) => e.kind === 'protocol'),
    resisted = events.filter(
      (e) =>
        e.eventType === 'resisted' &&
        Date.parse(e.occurredAt!) >= now - 7 * 86400000 &&
        Date.parse(e.occurredAt!) <= now,
    ).length;
  const recent = events.sort((a, b) => Date.parse(b.occurredAt!) - Date.parse(a.occurredAt!))[0];
  return (
    <section className="card protocol-summary" aria-label="自律与恢复">
      <div className="protocol-heading">
        <span className="icon-box">
          <ShieldCheck size={21} />
        </span>
        <div>
          <h2>下一次选择，由你决定。</h2>
          <p>诚实记录，也看见每一次抵抗。</p>
        </div>
      </div>
      <div className="protocol-clock">
        <span>距上次规则事件</span>
        <strong>{last ? elapsedSince(last.occurredAt!, now) : '尚无记录'}</strong>
      </div>
      <div className="protocol-count">
        <span>近 7 天成功抵抗</span>
        <strong>
          {resisted}
          <small> 次</small>
        </strong>
      </div>
      <div className="protocol-recent">
        <span>最近一次</span>
        <strong>{recent ? protocolCopy[recent.eventType!].label : '从一次真实选择开始'}</strong>
        {recent && (
          <small>
            {new Date(recent.occurredAt!).toLocaleString('zh-CN', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </small>
        )}
      </div>
      <div className="protocol-actions">
        <button className="text-button" onClick={() => open('interruption')}>
          冲动拦截
        </button>
        <button className="button secondary" onClick={() => open('protocol')}>
          记录选择
          <ArrowUpRight size={16} />
        </button>
      </div>
    </section>
  );
}
export function ProtocolForm({ profile }: { profile: Preferences }) {
  const { edit, close, notify, fail } = useUI();
  const [type, setType] = useState<NonNullable<Entry['eventType']>>(edit?.eventType ?? 'resisted'),
    [name, setName] = useState(edit?.name ?? ''),
    [notes, setNotes] = useState(edit?.notes ?? ''),
    [when, setWhen] = useState(() => {
      const d = new Date(edit?.occurredAt ?? Date.now());
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }),
    [ml, setMl] = useState(edit?.amount?.toString() ?? '330'),
    [per100, setPer100] = useState(edit?.sugarPer100?.toString() ?? ''),
    [source, setSource] = useState(edit?.sugarSource ?? '包装标签（自行填写）'),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const sugar = ml !== '' && per100 !== '' ? sugarAmount(Number(ml), Number(per100)) : null;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const at = new Date(when);
      if (!Number.isFinite(at.getTime()) || at.getTime() > Date.now() + 60000)
        throw Error('请填写实际发生时间，不可选择未来。');
      const record: Entry = {
        ...(edit ?? makeEntry('protocol', name.trim() || protocolCopy[type].label)),
        eventType: type,
        name: name.trim() || protocolCopy[type].label,
        notes,
        date: dayKey(at),
        occurredAt: at.toISOString(),
        amount: type === 'sugary-drink' && ml !== '' ? Number(ml) : undefined,
        unit: type === 'sugary-drink' ? 'ml' : undefined,
        sugarGrams: type === 'sugary-drink' ? (sugar ?? undefined) : undefined,
        sugarPer100: type === 'sugary-drink' && per100 !== '' ? Number(per100) : undefined,
        sugarSource: type === 'sugary-drink' ? source : undefined,
      };
      await repository.save(record);
      close();
      if (!edit && type !== 'resisted') useUI.setState({ flagged: record });
      else notify(edit ? '自律记录已修改' : '已记录一次成功抵抗。下一次，也由你选择。');
    } catch (e) {
      fail(e);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <div className="protocol-type">
        {(['resisted', 'sugary-drink', 'masturbation'] as const).map((t) => (
          <button
            type="button"
            key={t}
            className={type === t ? 'selected' : ''}
            disabled={!!edit && type !== t}
            onClick={() => setType(t)}
          >
            {t === 'masturbation'
              ? '自慰（个人规则）'
              : t === 'sugary-drink'
                ? '喝了含糖饮料'
                : '成功抵抗'}
          </button>
        ))}
      </div>
      <p className="muted text-sm">
        {type === 'resisted'
          ? '认真记下这次选择，不触发红色警示。'
          : '仅在你明确确认并保存后，显示红旗提醒。这是你选择的个人规则。'}
      </p>
      <Field label={type === 'sugary-drink' ? '饮料名称' : '记录名称（可选）'}>
        <input
          required={type === 'sugary-drink'}
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={type === 'sugary-drink' ? '例如：可乐、奶茶' : '例如：忍住了晚上的可乐'}
        />
      </Field>
      <Field label="实际发生时间">
        <input
          required
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
        />
      </Field>
      {type === 'sugary-drink' && (
        <>
          <div className="form-grid">
            <Field label="饮用量 (ml)，未知可留空">
              <input
                type="number"
                min="1"
                max="10000"
                step=".1"
                value={ml}
                onChange={(e) => setMl(e.target.value)}
              />
            </Field>
            <Field label="每 100 ml 糖 (g)，未知可留空">
              <input
                type="number"
                min="0"
                max="100"
                step=".1"
                value={per100}
                onChange={(e) => setPer100(e.target.value)}
              />
            </Field>
          </div>
          <Field label="糖数据来源">
            <input maxLength={300} value={source} onChange={(e) => setSource(e.target.value)} />
          </Field>
          <div className="callout">
            {sugar == null
              ? '糖含量未知，不记作 0。'
              : `本次约 ${fmt(sugar, 1)} g 糖，约 ${fmt(sugar / 4, 1)} 块展示方糖（4 g / 块）。`}
            <br />
            本条为自律事件，不自动加入饮食热量；饮食汇总请另行记餐，避免混淆。
          </div>
        </>
      )}
      <Field label="记录当时的情境（可选）">
        <textarea
          maxLength={1000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="发生了什么？下一次可以怎样选择？"
        />
      </Field>
      <div className="feedback-preferences">
        <label>
          <input
            type="checkbox"
            checked={profile.vibration !== false}
            onChange={(e) =>
              void attempt(() => repository.profile({ ...profile, vibration: e.target.checked }))
            }
          />
          支持时尝试短振动
        </label>
        <label>
          <input
            type="checkbox"
            checked={profile.alertSound === true}
            onChange={(e) =>
              void attempt(() => repository.profile({ ...profile, alertSound: e.target.checked }))
            }
          />
          短提示音（默认关闭）
        </label>
      </div>
      <button
        disabled={busy}
        className={
          'button full-width ' + (type === 'resisted' || edit ? 'primary' : 'danger-button')
        }
      >
        {busy
          ? '保存中…'
          : edit
            ? '保存修改'
            : type === 'resisted'
              ? '确认：这次我抵抗住了'
              : '确认记录，并显示红旗提醒'}
      </button>
      {edit && (
        <button
          className="text-button danger"
          type="button"
          onClick={() => {
            if (confirm('删除这条自律记录？'))
              void attempt(async () => {
                await repository.remove(edit.id);
                close();
                notify('记录已删除');
              });
          }}
        >
          删除记录
        </button>
      )}
    </form>
  );
}
export function RedFlagOverlay({ entry, profile }: { entry: Entry; profile: Preferences }) {
  const button = useRef<HTMLButtonElement>(null),
    [busy, setBusy] = useState(false);
  const copy = protocolCopy[entry.eventType!];
  const recoveryError = useUI((s) => s.error);
  const dismiss = () => {
    navigator.vibrate?.(0);
    useUI.setState({ flagged: null });
  };
  useEffect(() => {
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    button.current?.focus();
    if (profile.vibration !== false && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([100, 70, 160]);
      } catch {
        /* Visual warning remains sufficient. */
      }
    }
    let audio: AudioContext | undefined;
    if (profile.alertSound) {
      try {
        audio = new AudioContext();
        const oscillator = audio.createOscillator(),
          gain = audio.createGain();
        oscillator.frequency.value = 220;
        gain.gain.setValueAtTime(0.035, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.25);
        oscillator.connect(gain).connect(audio.destination);
        oscillator.start();
        oscillator.stop(audio.currentTime + 0.25);
      } catch {
        /* Audio is optional. */
      }
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
      if (e.key === 'Tab') {
        const nodes = Array.from(
          document.querySelectorAll<HTMLElement>('.red-flag button:not([disabled])'),
        );
        if (e.shiftKey && document.activeElement === nodes[0]) {
          e.preventDefault();
          nodes.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === nodes.at(-1)) {
          e.preventDefault();
          nodes[0]?.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener('keydown', key);
      navigator.vibrate?.(0);
      void audio?.close();
    };
  }, []);
  return (
    <div
      className="red-flag"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="flag-title"
      aria-describedby="flag-message"
    >
      <button className="flag-close" aria-label="关闭警示，保留已保存记录" onClick={dismiss}>
        <X size={24} />
      </button>
      <div className="flag-inner">
        <span className="flag-eyebrow">RED FLAG PROTOCOL · 已保存记录</span>
        <div className="flag-symbol" aria-hidden="true">
          !
        </div>
        <h2 id="flag-title">{copy.label}</h2>
        <p className="flag-english" lang="en">
          {copy.en}
        </p>
        <p id="flag-message" className="flag-chinese">
          {copy.zh}
        </p>
        <div className="flag-details">
          <strong>{entry.name}</strong>
          <span>{new Date(entry.occurredAt!).toLocaleString('zh-CN')}</span>
          {entry.eventType === 'sugary-drink' && (
            <span>
              {entry.amount == null ? '饮用量未知' : `${entry.amount} ml`} ·{' '}
              {entry.sugarGrams == null ? '糖含量未知' : `${fmt(entry.sugarGrams, 1)} g 糖`}
            </span>
          )}
          {entry.notes && <span>{entry.notes}</span>}
        </div>
        {recoveryError && (
          <p className="flag-chinese" role="alert">
            恢复确认暂未保存：{recoveryError}。事件本身已保存，可重试或关闭警示。
          </p>
        )}
        <button
          ref={button}
          disabled={busy}
          className="flag-ack"
          onClick={async () => {
            if (busy) return;
            setBusy(true);
            const ok = await attempt(() =>
              db.entries.update(entry.id, {
                recoveryAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }),
            );
            setBusy(false);
            if (ok) {
              dismiss();
              useUI.getState().notify('已经记录。喝一口水，从下一次选择重新开始。');
            }
          }}
        >
          <Check size={20} />
          已经记录。现在重启。
        </button>
        <small>历史记录和其他进度会保留 · 可按 Esc 返回</small>
      </div>
    </div>
  );
}
