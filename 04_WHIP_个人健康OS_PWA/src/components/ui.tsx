import { useEffect, useRef, type ReactNode } from 'react';
import { X, ArrowUpRight, Plus } from 'lucide-react';
import { useUI } from '../lib/store';
import { fmt } from '../lib/domain';
export function Section({
  title,
  action,
  onClick,
  children,
}: {
  title: string;
  action?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="section">
      <div className="section-heading">
        <h2>{title}</h2>
        {action && (
          <button className="text-button" onClick={onClick}>
            {action}
            <ArrowUpRight size={15} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={'card ' + className}>{children}</div>;
}
export function Empty({
  icon,
  title,
  body,
  action,
  onClick,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: string;
  onClick?: () => void;
}) {
  return (
    <div className="empty">
      {icon && <div className="empty-icon">{icon}</div>}
      <h3>{title}</h3>
      <p>{body}</p>
      {action && (
        <button className="button secondary" onClick={onClick}>
          <Plus size={16} />
          {action}
        </button>
      )}
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Progress({
  value,
  target,
  color = 'var(--mint)',
  label,
}: {
  value: number;
  target: number;
  color?: string;
  label: string;
}) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={target}
      aria-valuenow={Math.round(value)}
    >
      <span style={{ width: Math.min(100, (value / target) * 100) + '%', background: color }} />
    </div>
  );
}
export function Metric({
  label,
  value,
  unit,
  icon,
  color = 'mint',
  onClick,
  sub,
}: {
  label: string;
  value: string;
  unit: string;
  icon: ReactNode;
  color?: string;
  onClick?: () => void;
  sub?: string;
}) {
  return (
    <button className={'card metric ' + color} onClick={onClick}>
      <div className="metric-top">
        <span className="icon-box">{icon}</span>
        <Plus size={17} />
      </div>
      <span className="metric-label">{label}</span>
      <div className="metric-number">
        {value}
        <small>{unit}</small>
      </div>
      <span className="muted text-xs">{sub}</span>
    </button>
  );
}
export function Sheet({ title, children }: { title: string; children: ReactNode }) {
  const close = useUI((s) => s.close);
  const ref = useRef<HTMLDivElement>(null);
  const dirty = useRef(false);
  const guardedClose = () => {
    if (dirty.current && ref.current?.querySelector('form') && !confirm('放弃尚未保存的修改？'))
      return;
    close();
  };
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const el = ref.current;
    const first = el?.querySelector<HTMLElement>('input,select,button,textarea');
    first?.focus();
    const onChange = () => {
      dirty.current = true;
    };
    el?.addEventListener('input', onChange);
    const unload = (e: BeforeUnloadEvent) => {
      if (dirty.current && el?.querySelector('form')) e.preventDefault();
    };
    window.addEventListener('beforeunload', unload);
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') guardedClose();
      if (e.key === 'Tab' && el) {
        const nodes = Array.from(
          el.querySelectorAll<HTMLElement>(
            'button:not([disabled]),input:not([disabled]),select,textarea,a[href]',
          ),
        );
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener('keydown', key);
      previous?.focus();
      el?.removeEventListener('input', onChange);
      window.removeEventListener('beforeunload', unload);
    };
  }, [close]);
  return (
    <div
      className="scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget) guardedClose();
      }}
    >
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h2>{title}</h2>
          <button className="icon-button" aria-label="关闭" onClick={guardedClose}>
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export const number = (n: number | null | undefined, d = 0) => (n == null ? '—' : fmt(n, d));
