export type Kind =
  | 'meal'
  | 'water'
  | 'workout'
  | 'body'
  | 'sleep'
  | 'mood'
  | 'supplement'
  | 'habit'
  | 'photo'
  | 'protocol';
export interface Nutrients {
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber?: number | null;
  sugar?: number | null;
  sodium?: number | null;
  saturatedFat?: number | null;
  caffeine?: number | null;
}
export interface Food {
  id: string;
  name: string;
  english: string;
  aliases: string;
  nutrients: Nutrients;
  basis: 'g' | 'ml';
  source: string;
  sourceId: string;
  quality: 'reference' | 'estimate' | 'label' | 'user';
  sourceURL?: string;
  retrievedAt?: string;
  servings: { name: string; amount: number }[];
  favorite?: boolean;
}
export interface RoutePoint {
  lat: number;
  lng: number;
  time: number;
  accuracy: number;
  segment: number;
}
export interface SetRecord {
  exercise: string;
  weight: number;
  reps: number;
  done: boolean;
  rest: number;
}
export interface Entry {
  id: string;
  kind: Kind;
  date: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  notes: string;
  amount?: number;
  unit?: string;
  foodId?: string;
  nutrients?: Nutrients;
  quality?: Food['quality'];
  source?: string;
  meal?: string;
  duration?: number;
  distance?: number;
  sets?: SetRecord[];
  route?: RoutePoint[];
  start?: number;
  end?: number;
  pausedAt?: number;
  pausedMs?: number;
  status?: 'active' | 'paused' | 'done';
  activityType?: string;
  rpe?: number;
  bedtime?: string;
  wakeTime?: string;
  energy?: number;
  waist?: number;
  bodyFat?: number;
  photo?: string;
  category?: string;
  timezone?: string;
  estimatedCalories?: number;
  eventType?: 'masturbation' | 'sugary-drink' | 'resisted';
  occurredAt?: string;
  recoveryAt?: string;
  sugarGrams?: number;
  sugarPer100?: number;
  sugarSource?: string;
}
export interface Preferences {
  id: 'profile';
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  sleep: number;
  workouts: number;
  weightGoal: number;
  height: number;
  units: 'metric' | 'imperial';
  theme: 'system' | 'dark' | 'light';
  language: 'zh-CN' | 'en';
  onboarded: boolean;
  avatarStyle?: 'initials' | 'orbit' | 'mountain' | 'wave' | 'court';
  avatar?: string;
  weatherLocation?: { name: string; latitude: number; longitude: number; country?: string };
  vibration?: boolean;
  alertSound?: boolean;
  lastBackup?: string;
  dismissed: string[];
  waterShortcuts: number[];
  habits: string[];
}
export interface Template {
  id: string;
  name: string;
  kind: 'meal' | 'workout';
  entries: Entry[];
  createdAt: string;
}
export interface Backup {
  app: 'VITAL' | 'WHIP';
  version: 1;
  exportedAt: string;
  entries: Entry[];
  foods: Food[];
  templates: Template[];
  profile: Preferences;
}
export const defaults: Preferences = {
  id: 'profile',
  name: '',
  calories: 2000,
  protein: 100,
  carbs: 250,
  fat: 65,
  water: 2000,
  sleep: 8,
  workouts: 3,
  weightGoal: 65,
  height: 170,
  units: 'metric',
  theme: 'system',
  language: 'zh-CN',
  onboarded: false,
  dismissed: [],
  waterShortcuts: [150, 250, 350, 500],
  habits: ['舒展身体', '读一会儿书', '留点时间给自己'],
};
