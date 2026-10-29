import { useEffect, useState, lazy, Suspense } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRegisterSW } from 'virtual:pwa-register/react';
import {
  Leaf,
  LayoutDashboard,
  Utensils,
  Footprints,
  ChartNoAxesCombined,
  UserRound,
  Plus,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ArrowUpRight,
  Download,
  Settings,
  WifiOff,
  X,
  Droplets,
  Moon,
  Scale,
  Heart,
  Camera,
  Pill,
  Check,
  Search,
  HeartPulse,
} from 'lucide-react';
import { db, repository } from './lib/db';
import { dayKey, shiftDay } from './lib/domain';
import type { Kind } from './lib/types';
import { useUI, attempt, type Tab } from './lib/store';
import { strings } from './lib/i18n';
import { Sheet } from './components/ui';
import { Today, kindInfo } from './features/Today';
import { Nutrition } from './features/Nutrition';
import { Activity, useWorkoutTracking } from './features/Activity';
const Trends = lazy(() => import('./features/Trends').then((m) => ({ default: m.Trends })));
import { Profile } from './features/Profile';
import { BrandMark, APP_VERSION } from './components/Brand';
import { Avatar, AvatarPicker } from './components/Avatar';
import { WeatherSettings } from './features/Weather';
import { GlobalSearch } from './features/GlobalSearch';
import { authClient, isPasswordRecovery } from './lib/auth';
import { FoodLibrary as DishMenu } from './features/FoodLibrary';
import { Account } from './features/Account';
import { ProtocolForm, RedFlagOverlay } from './features/Protocol';
import { Interruption } from './features/Interruption';
import { SugarLab } from './features/Sugar';
const PhotoFood = lazy(() =>
  import('./features/PhotoFood').then((m) => ({ default: m.PhotoFood })),
);
import { FoodForm } from './features/FoodForm';
import { RecordForm } from './features/RecordForm';
import { GoalsForm, BackupForm, InstallGuide, TemplatesForm } from './features/SettingsForms';
const tabs: { id: Tab; icon: typeof Leaf }[] = [
  { id: 'today', icon: LayoutDashboard },
  { id: 'nutrition', icon: Utensils },
  { id: 'activity', icon: Footprints },
  { id: 'trends', icon: ChartNoAxesCombined },
  { id: 'profile', icon: UserRound },
];
export default function App() {
  const entries = useLiveQuery(() => db.entries.toArray()) ?? [];
  const foods = useLiveQuery(() => db.foods.toArray()) ?? [];
  const templates = useLiveQuery(() => db.templates.toArray()) ?? [];
  const profile = useLiveQuery(() => db.preferences.get('profile'));
  const { tab, setTab, day, setDay, modal, edit, open, close, toast, error, flagged } = useUI();
  const [online, setOnline] = useState(navigator.onLine);
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: () => useUI.getState().notify('离线缓存未就绪，请联网重新打开'),
  });
  const active = entries.find((e) => e.kind === 'workout' && e.status !== 'done');
  useWorkoutTracking(active);
  useEffect(() => {
    const f = () => setOnline(navigator.onLine);
    window.addEventListener('online', f);
    window.addEventListener('offline', f);
    return () => {
      window.removeEventListener('online', f);
      window.removeEventListener('offline', f);
    };
  }, []);
  useEffect(() => {
    if (profile) {
      document.documentElement.lang = profile.language;
      const mq = window.matchMedia('(prefers-color-scheme:dark)');
      const update = () => {
        const dark = profile.theme === 'dark' || (profile.theme === 'system' && mq.matches);
        document.documentElement.dataset.theme = dark ? 'dark' : 'light';
        document
          .querySelector('meta[name=theme-color]')
          ?.setAttribute('content', dark ? '#111217' : '#f5f5f7');
      };
      update();
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    }
  }, [profile?.theme, profile?.language]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [tab]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (profile?.onboarded) open('search');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, profile?.onboarded]);
  useEffect(() => {
    if (!authClient) return;
    if (isPasswordRecovery) open('account');
    const { data } = authClient.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') open('account');
    });
    return () => data.subscription.unsubscribe();
  }, [open]);
  if (!profile)
    return (
      <div className="boot">
        <span className="wordmark">WHIP</span>
        <span className="brand-version">1.2</span>
        <p>正在打开你的健康空间…</p>
      </div>
    );
  const t = strings[profile.language];
  const date = new Date(day + 'T12:00:00');
  const monday = shiftDay(day, -((date.getDay() + 6) % 7));
  const dateTitle = date.toLocaleDateString(profile.language, {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        跳到主要内容
      </a>
      <main id="main" inert={!!modal || !!flagged || !profile.onboarded}>
        <header className="topbar">
          <div className="topbar-inner">
            <button className="topbar-brand" aria-label="WHIP 今日" onClick={() => setTab('today')}>
              <span className="brand-glyph">
                <BrandMark size={30} />
              </span>
              <span className="wordmark">WHIP</span>
              <span className="brand-version">1.2</span>
            </button>
            <nav className="top-navigation" aria-label="主要导航">
              {tabs.map(({ id }) => (
                <button
                  key={id}
                  className={tab === id ? 'active' : ''}
                  aria-current={tab === id ? 'page' : undefined}
                  onClick={() => setTab(id)}
                >
                  {t[id]}
                </button>
              ))}
            </nav>
            <div className="topbar-right">
              <button
                className="top-search-button tooltip-anchor"
                data-tooltip="搜索记录 · ⌘ K"
                aria-label="搜索记录"
                onClick={() => open('search')}
              >
                <Search size={18} />
                <span>搜索</span>
                <kbd>⌘ K</kbd>
              </button>
              <button
                className="topbar-profile tooltip-anchor"
                data-tooltip="我的资料"
                aria-label="个人资料"
                onClick={() => setTab('profile')}
              >
                <Avatar profile={profile} className="compact" />
              </button>
            </div>
          </div>
        </header>
        <div className="main-content">
          <div className="page-header">
            <div>
              <div className="date-caption">
                {dateTitle}
                <span className="caption-line" />
              </div>
              <h1>
                {tab === 'today'
                  ? profile.name
                    ? `${profile.name}，${new Date().getHours() < 12 ? '早上好' : '你好'}。`
                    : t.greeting
                  : t[tab]}
              </h1>
              <p>
                {tab === 'today'
                  ? t.intro
                  : {
                      nutrition: '好好吃饭，是关照自己的第一步。',
                      activity: '让身体动起来，让生活有力量。',
                      trends: '每一次记录，都是理解自己的线索。',
                      profile: '你的生活节奏，你的健康空间。',
                    }[tab]}
              </p>
            </div>
            <button className="button primary desktop-quick" onClick={() => open('quick')}>
              <Plus size={19} />
              {t.quick}
            </button>
          </div>
          {!online && (
            <div className="offline-banner">
              <WifiOff size={16} />
              正在离线使用。记录仍会保存在此设备。
            </div>
          )}
          {needRefresh && (
            <div className="offline-banner">
              <Download size={16} />
              新版本已就绪。
              <button
                className="text-button"
                onClick={() => {
                  if (!active) void updateServiceWorker(true);
                  else useUI.getState().notify('请先完成当前运动，再更新应用');
                }}
              >
                保存记录后更新
              </button>
            </div>
          )}
          {(tab === 'today' || tab === 'nutrition') && (
            <div className="date-strip">
              <button
                className="icon-button"
                aria-label="上一周"
                onClick={() => setDay(shiftDay(day, -7))}
              >
                <ChevronLeft size={18} />
              </button>
              <div className="week-days">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = shiftDay(monday, i);
                  return (
                    <button
                      key={d}
                      className={'day-button ' + (d === day ? 'selected' : '')}
                      onClick={() => setDay(d)}
                      aria-label={d}
                      aria-pressed={d === day}
                    >
                      <span>{['一', '二', '三', '四', '五', '六', '日'][i]}</span>
                      <strong>{new Date(d + 'T12:00:00').getDate()}</strong>
                      <i className={entries.some((e) => e.date === d) ? 'has-data' : ''} />
                    </button>
                  );
                })}
              </div>
              <button
                className="icon-button"
                aria-label="下一周"
                onClick={() => setDay(shiftDay(day, 7))}
              >
                <ChevronRight size={18} />
              </button>
              <button className="today-chip" onClick={() => setDay(dayKey())}>
                今天
              </button>
              <label className="calendar-button">
                <span>选择日期</span>
                <input
                  aria-label="选择记录日期"
                  type="date"
                  value={day}
                  onChange={(e) => e.target.value && setDay(e.target.value)}
                />
              </label>
            </div>
          )}
          {tab === 'today' && <Today entries={entries} profile={profile} />}{' '}
          {tab === 'nutrition' && (
            <Nutrition entries={entries} profile={profile} templates={templates} />
          )}{' '}
          {tab === 'activity' && (
            <Activity entries={entries} profile={profile} templates={templates} />
          )}{' '}
          {tab === 'trends' && (
            <Suspense
              fallback={
                <div className="page-skeleton" role="status" aria-label="正在整理你的趋势">
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-panel" />
                  <span className="sr-only">正在整理你的趋势…</span>
                </div>
              }
            >
              <Trends entries={entries} profile={profile} />
            </Suspense>
          )}{' '}
          {tab === 'profile' && (
            <Profile
              entries={entries}
              profile={profile}
              onCheckUpdate={async () => {
                try {
                  if (!('serviceWorker' in navigator)) {
                    useUI.getState().notify('此浏览器不支持离线更新，请重新打开正式网址');
                    return;
                  }
                  const reg = await navigator.serviceWorker.getRegistration();
                  if (!reg) {
                    useUI.getState().notify('当前入口尚未注册离线缓存，请重新打开正式网址');
                    return;
                  }
                  await reg.update();
                  if (reg.waiting) {
                    if (active) useUI.getState().notify('新版本已准备好，请先完成当前运动');
                    else void updateServiceWorker(true);
                  } else
                    useUI
                      .getState()
                      .notify('已检查更新；发现新版本会显示提示。当前 WHIP ' + APP_VERSION);
                } catch (e) {
                  useUI.getState().fail(e);
                }
              }}
            />
          )}
          <div className="page-bottom-note">
            <ShieldCheck size={13} />
            <span>每条记录都留在你的设备。规则由你设定，行动由你执行。</span>
            <span className="version-label">WHIP 1.2</span>
          </div>
        </div>
      </main>
      <button
        inert={!!modal || !!flagged || !profile.onboarded}
        className="floating-add"
        aria-label="快速记录"
        onClick={() => open('quick')}
      >
        <Plus size={26} />
      </button>
      <nav
        inert={!!modal || !!flagged || !profile.onboarded}
        className="bottom-nav"
        aria-label="底部导航"
      >
        {tabs.map(({ id, icon: Icon }) => (
          <button
            key={id}
            aria-current={tab === id ? 'page' : undefined}
            className={tab === id ? 'active' : ''}
            onClick={() => setTab(id)}
          >
            <Icon size={21} />
            <span>{t[id]}</span>
          </button>
        ))}
      </nav>
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
      {error && (
        <div className="error-toast" role="alert">
          <span>{error}</span>
          <button aria-label="关闭错误信息" onClick={() => useUI.setState({ error: '' })}>
            <X size={18} />
          </button>
        </div>
      )}
      {flagged && <RedFlagOverlay entry={flagged} profile={profile} />}
      {modal && !flagged && (
        <Sheet
          key={modal + (edit?.id ?? '')}
          title={
            modal === 'interruption'
              ? 'WHIP · 立即中断'
              : modal === 'account'
                ? '我的 WHIP 账户'
                : modal === 'dishes'
                  ? 'WHIP 菜品、食材与饮料'
                  : modal === 'photo-food'
                    ? '拍照辅助识别'
                    : modal === 'sugar'
                      ? '饮料与糖'
                      : modal === 'protocol'
                        ? '自律记录'
                        : modal === 'search'
                          ? '搜索你的健康空间'
                          : modal === 'avatar'
                            ? '选择头像'
                            : modal === 'weather'
                              ? '天气与城市'
                              : modal === 'quick'
                                ? '记录生活的小事'
                                : modal === 'meal'
                                  ? edit
                                    ? '编辑饮食记录'
                                    : '添加食物'
                                  : modal === 'goals'
                                    ? '个人资料与目标'
                                    : modal === 'backup'
                                      ? '备份与恢复'
                                      : modal === 'install'
                                        ? '添加到主屏幕'
                                        : modal === 'templates'
                                          ? '餐食模板'
                                          : `${edit ? '编辑' : '记录'}${kindInfo[modal as Kind]?.label ?? ''}`
          }
        >
          {modal === 'quick' ? (
            <div className="quick-grid">
              {(Object.entries(kindInfo) as [Kind, (typeof kindInfo)[Kind]][]).map(
                ([kind, { label, icon: Icon, color }]) => (
                  <button
                    key={kind}
                    className={'quick-action ' + color}
                    onClick={() => {
                      if (kind === 'workout') {
                        close();
                        setTab('activity');
                      } else open(kind);
                    }}
                  >
                    <span className="icon-box">
                      <Icon size={24} />
                    </span>
                    <strong>{label}</strong>
                    <small>
                      {
                        {
                          meal: '认真吃一餐',
                          water: '给自己一杯水',
                          workout: '动一动身体',
                          body: '看见一点变化',
                          sleep: '记录昨夜休息',
                          mood: '听听自己的感受',
                          supplement: '记下实际摄入',
                          habit: '完成一件小事',
                          photo: '留下成长的样子',
                          protocol: '诚实记录一次选择',
                        }[kind]
                      }
                    </small>
                  </button>
                ),
              )}
            </div>
          ) : modal === 'interruption' ? (
            <Interruption />
          ) : modal === 'account' ? (
            <Account />
          ) : modal === 'dishes' ? (
            <DishMenu />
          ) : modal === 'photo-food' ? (
            <Suspense
              fallback={
                <div
                  className="skeleton skeleton-panel"
                  role="status"
                  aria-label="正在准备照片工具"
                />
              }
            >
              <PhotoFood />
            </Suspense>
          ) : modal === 'sugar' ? (
            <SugarLab />
          ) : modal === 'protocol' ? (
            <ProtocolForm profile={profile} />
          ) : modal === 'search' ? (
            <GlobalSearch entries={entries} />
          ) : modal === 'avatar' ? (
            <AvatarPicker profile={profile} />
          ) : modal === 'weather' ? (
            <WeatherSettings profile={profile} />
          ) : modal === 'meal' ? (
            <FoodForm foods={foods} entries={entries} />
          ) : modal === 'goals' ? (
            <GoalsForm profile={profile} />
          ) : modal === 'backup' ? (
            <BackupForm profile={profile} />
          ) : modal === 'install' ? (
            <InstallGuide />
          ) : modal === 'templates' ? (
            <TemplatesForm templates={templates} />
          ) : (
            <RecordForm kind={modal as Kind} profile={profile} />
          )}
        </Sheet>
      )}
      {!profile.onboarded && !modal && (
        <div className="onboarding scrim">
          <div className="welcome-card" role="dialog" aria-modal="true" aria-label="欢迎来到 WHIP">
            <span className="welcome-icon">
              <BrandMark size={56} />
            </span>
            <span className="wordmark">WHIP.</span>
            <h2>
              你的健康，
              <br />
              由你掌握。
            </h2>
            <p>
              饮食、运动、睡眠与生活，
              <br />
              在一个安静的空间里，慢慢记录。
            </p>
            <div className="welcome-features">
              <span>
                <ShieldCheck size={17} />
                只存于设备
              </span>
              <span>
                <Check size={17} />
                无需账户
              </span>
              <span>
                <Download size={17} />
                随时备份
              </span>
            </div>
            <button
              autoFocus
              className="button primary full-width"
              onClick={() =>
                attempt(
                  () => repository.profile({ ...profile, onboarded: true }),
                  '欢迎来到 WHIP。先从一条小记录开始吧。',
                )
              }
            >
              开启我的健康空间
              <ArrowUpRight size={18} />
            </button>
            <small>
              开始时不会插入示例健康数据。
              <br />
              初始目标可在「我的」中自由调整。
            </small>
          </div>
        </div>
      )}
    </div>
  );
}
