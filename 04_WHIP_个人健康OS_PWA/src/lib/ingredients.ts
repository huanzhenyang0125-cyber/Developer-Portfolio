import raw from './ingredient-data.json';
import { starterFoods } from './catalog';
import type { Food } from './types';
export interface Ingredient {
  key: string;
  category: string;
  food: Food;
}
export const expandedIngredients = raw as Ingredient[];
const originalCategories: Record<string, string> = {
  rice: '谷薯主食',
  egg: '肉蛋海鲜',
  chicken: '肉蛋海鲜',
  banana: '水果',
  apple: '水果',
  oats: '谷薯主食',
  milk: '豆乳坚果',
  tofu: '豆乳坚果',
  salmon: '肉蛋海鲜',
  broccoli: '蔬菜菌菇',
  bread: '谷薯主食',
  yogurt: '豆乳坚果',
  potato: '谷薯主食',
  orange: '水果',
  almond: '豆乳坚果',
  coffee: '油盐酱料',
};
export const ingredients: Ingredient[] = [
  ...starterFoods.map((food) => ({
    key: food.id.replace('usda-', ''),
    category: originalCategories[food.id.replace('usda-', '')],
    food,
  })),
  ...expandedIngredients,
];
export const ingredientByKey = new Map(ingredients.map((i) => [i.key, i]));
