export const APP_NAME = 'WHIP';
export const APP_VERSION = '1.2.0';
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect width="48" height="48" rx="14" fill="currentColor" />
      <path
        d="m10 15 6.5 21 7.5-12 7.5 12L38 15"
        stroke="white"
        strokeWidth="3.8"
        strokeLinejoin="miter"
        strokeLinecap="square"
      />
      <path d="m25 11 8-3" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
