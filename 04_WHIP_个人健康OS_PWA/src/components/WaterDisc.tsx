import { fmt } from '../lib/domain';
export function WaterDisc({ amount, target }: { amount: number; target: number }) {
  const ratio = target > 0 ? amount / target : 0;
  return (
    <div
      className="water-disc"
      role="progressbar"
      aria-label="饮水圆盘"
      aria-valuemin={0}
      aria-valuemax={target}
      aria-valuenow={Math.min(amount, target)}
      aria-valuetext={`已记录${amount}毫升，目标${target}毫升`}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="50" className="water-disc-track" />
        <circle
          cx="60"
          cy="60"
          r="50"
          className="water-disc-arc"
          pathLength="100"
          strokeDasharray={`${Math.min(100, ratio * 100)} 100`}
        />
        <circle cx="60" cy="60" r="39" className="water-disc-inner" />
      </svg>
      <span>
        <strong>
          {fmt(ratio * 100)}
          <small>%</small>
        </strong>
        <em>目标进度</em>
      </span>
    </div>
  );
}
