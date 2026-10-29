import { create } from 'zustand';
import { dayKey } from './domain';
import type { Entry, Kind } from './types';
export type Tab = 'today' | 'nutrition' | 'activity' | 'trends' | 'profile';
interface UI {
  tab: Tab;
  day: string;
  modal:
    | Kind
    | 'quick'
    | 'goals'
    | 'backup'
    | 'install'
    | 'food-create'
    | 'templates'
    | 'avatar'
    | 'weather'
    | 'search'
    | 'account'
    | 'dishes'
    | 'photo-food'
    | 'sugar'
    | 'interruption'
    | null;
  edit: Entry | null;
  foodSelection: string | null;
  foodPortion: number;
  flagged: Entry | null;
  drinkSelection: string | null;
  chooseDrink: (id: string) => void;
  selectFood: (id: string, portion: number) => void;
  toast: string;
  error: string;
  setTab: (t: Tab) => void;
  setDay: (d: string) => void;
  open: (m: UI['modal'], e?: Entry) => void;
  close: () => void;
  notify: (s: string) => void;
  fail: (e: unknown) => void;
}
export const useUI = create<UI>((set) => ({
  tab: 'today',
  day: dayKey(),
  modal: null,
  edit: null,
  foodSelection: null,
  foodPortion: 100,
  flagged: null,
  drinkSelection: null,
  chooseDrink: (id) =>
    set({ modal: 'sugar', drinkSelection: id, foodSelection: null, edit: null, error: '' }),
  selectFood: (id, portion) =>
    set({ foodSelection: id, foodPortion: portion, modal: 'meal', edit: null, error: '' }),
  toast: '',
  error: '',
  setTab: (tab) => set({ tab }),
  setDay: (day) => set({ day }),
  open: (modal, edit) =>
    set({ modal, edit: edit ?? null, drinkSelection: null, foodSelection: null, error: '' }),
  close: () => set({ modal: null, edit: null, foodSelection: null, error: '' }),
  notify: (toast) => {
    set({ toast });
    setTimeout(() => set({ toast: '' }), 3500);
  },
  fail: (e) =>
    set({
      error:
        e instanceof Error && /quota/i.test(e.name)
          ? '设备储存空间不足。请先导出备份，释放浏览器空间后重试；本次记录尚未保存。'
          : e instanceof Error && /security|invalidstate|unknownerror/i.test(e.name)
            ? '无法写入浏览器储存。请关闭无痕模式并检查空间，然后重试。'
            : e instanceof Error
              ? e.message
              : '保存失败。请检查浏览器储存空间并导出备份后重试。',
    }),
}));
export async function attempt(fn: () => Promise<unknown>, message?: string) {
  try {
    await fn();
    if (message) useUI.getState().notify(message);
    return true;
  } catch (e) {
    useUI.getState().fail(e);
    return false;
  }
}
