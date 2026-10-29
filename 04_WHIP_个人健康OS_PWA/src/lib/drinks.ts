import raw from './drink-data.json';
export interface Drink {
  id: string;
  name: string;
  brand: string;
  market: '马来西亚' | '中国大陆';
  category: string;
  sugarPer100: number | null;
  kcalPer100: number | null;
  defaultMl: number;
  packSizesMl: number[];
  sourceUrl: string;
  sourceTitle: string;
  sourceBasis: string;
  verified: boolean;
  note: string;
}
export const drinks = raw.drinks as Drink[];
export const drinkById = new Map(drinks.map((d) => [d.id, d]));
export const drinkSource = (d: Drink) => `${d.market} · ${d.sourceTitle} · ${d.sourceBasis}`;
