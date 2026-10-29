import { useState, useEffect, useRef } from 'react';
import { Shield, Timer, Check, Footprints, Moon, Smartphone } from 'lucide-react';
import { interruptionCopy } from '../lib/protocol';
import { makeEntry } from '../lib/domain';
import { repository } from '../lib/db';
import { useUI } from '../lib/store';
export function Interruption() {
  const [mode, setMode] = useState<'urge' | 'night'>('urge'),
    [until, setUntil] = useState<number | null>(null),
    [now, setNow] = useState(Date.now()),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    if (!until) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [until]);
  const seconds = until ? Math.max(0, Math.ceil((until - now) / 1000)) : 60;
  const copy = interruptionCopy[mode];
  return (
    <div className="interruption">
      <div className="pills">
        <button
          className={mode === 'urge' ? 'selected' : ''}
          onClick={() => {
            setMode('urge');
            setUntil(null);
          }}
        >
          冲动中断
        </button>
        <button
          className={mode === 'night' ? 'selected' : ''}
          onClick={() => {
            setMode('night');
            setUntil(null);
          }}
        >
          熬夜收手
        </button>
      </div>
      <span className="interruption-icon">
        {mode === 'urge' ? <Shield size={36} /> : <Moon size={36} />}
      </span>
      <span className="eyebrow">WHIP · EXECUTE, DON'T NEGOTIATE</span>
      <h3>{copy.title}</h3>
      <p className="interruption-main">{copy.zh}</p>
      <div className="interruption-steps">
        {copy.steps.map((text, i) => (
          <div key={text}>
            <span>{i + 1}</span>
            <strong>{text}</strong>
          </div>
        ))}
      </div>
      <div className="interruption-clock">
        <span>{until ? '离开屏幕计时' : '现在执行一次中断'}</span>
        <strong>
          {String(seconds).padStart(2, '0')}
          <small> 秒</small>
        </strong>
      </div>
      {!until ? (
        <button
          className="button primary full-width"
          onClick={() => {
            setNow(Date.now());
            setUntil(Date.now() + 60000);
          }}
        >
          <Timer size={18} />
          开始60秒，先离开屏幕
        </button>
      ) : (
        <>
          <p className="muted text-sm" role="status">
            {seconds > 0
              ? '现在就站起来。页面可关闭，不会锁住你。'
              : '时间到了。是否真的停下来，由你如实确认。'}
          </p>
          <button
            className="button primary full-width"
            disabled={busy || seconds > 0}
            onClick={async () => {
              if (lock.current) return;
              lock.current = true;
              setBusy(true);
              try {
                await repository.save({
                  ...makeEntry('protocol', mode === 'urge' ? '主动中断冲动' : '主动结束熬夜'),
                  eventType: 'resisted',
                  occurredAt: new Date().toISOString(),
                  notes: '用户在WHIP中断练习后主动确认成功抵抗。',
                });
                useUI.getState().close();
                useUI.getState().notify('行动已经留下证据。继续执行。');
              } catch (e) {
                useUI.getState().fail(e);
              } finally {
                lock.current = false;
                setBusy(false);
              }
            }}
          >
            <Check size={18} />
            我已经停下，记录这次抵抗
          </button>
        </>
      )}
      <p className="source-note">
        这是你自愿启动的个人规则练习，不代表行为诊断，也不能替你关闭其他应用。实际是否离开屏幕需要你执行。随时可关闭，不会自动记成违规。
      </p>
    </div>
  );
}
