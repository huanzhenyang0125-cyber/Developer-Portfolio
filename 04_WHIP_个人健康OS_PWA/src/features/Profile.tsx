import {
  UserRound,
  ShieldCheck,
  Download,
  Smartphone,
  SlidersHorizontal,
  Moon,
  Sun,
  Monitor,
  ArrowUpRight,
  Scale,
  BedDouble,
  Heart,
  Pill,
  Camera,
  Check,
  Database,
  Globe,
  HardDrive,
  Trash2,
} from 'lucide-react';
import type { Preferences, Entry } from '../lib/types';
import { repository } from '../lib/db';
import { authConfigured } from '../lib/auth';
import { useUI, attempt } from '../lib/store';
import { Card, Section } from '../components/ui';
import { EntryList } from './Today';
import { APP_VERSION } from '../components/Brand';
import { Avatar } from '../components/Avatar';
export function Profile({
  profile,
  entries,
  onCheckUpdate,
}: {
  profile: Preferences;
  entries: Entry[];
  onCheckUpdate: () => void;
}) {
  const { open, notify } = useUI();
  return (
    <>
      <Card className="profile-hero">
        <button
          className="profile-avatar-button tooltip-anchor"
          data-tooltip="更换头像"
          aria-label="更换头像"
          onClick={() => open('avatar')}
        >
          <Avatar profile={profile} />
          <span className="avatar-edit-badge">
            <Camera size={12} />
          </span>
        </button>
        <div>
          <span className="muted text-sm">属于你的健康空间</span>
          <h2>{profile.name || '你好，生活的记录者'}</h2>
          <span className="local-badge">
            <ShieldCheck size={13} />
            本地储存 · 自选登录 · 无订阅
          </span>
        </div>
        <button className="icon-button" aria-label="编辑个人目标" onClick={() => open('goals')}>
          <SlidersHorizontal size={21} />
        </button>
      </Card>
      <div className="card release-card">
        <div>
          <strong>WHIP {APP_VERSION}</strong>
          <p>新版食物图鉴 · 30款饮料 · 糖块掉落 · 冲动中断</p>
        </div>
        <button className="button secondary" onClick={onCheckUpdate}>
          检查版本更新
        </button>
      </div>
      <div className="profile-columns">
        <div>
          <div className="card account-entry">
            <span className="icon-box">
              <UserRound size={22} />
            </span>
            <div>
              <h3>我的 WHIP 账户</h3>
              <p>
                {authConfigured
                  ? '可选邮箱账户 · 健康记录留在本机。'
                  : '登录与注册已准备好，身份服务待连接。'}
              </p>
            </div>
            <button className="button secondary" onClick={() => open('account')}>
              账户与登录
            </button>
          </div>
          <Section title="身体与生活">
            <div className="lifestyle-grid">
              {(
                [
                  ['body', '身体测量', Scale],
                  ['sleep', '睡眠记录', BedDouble],
                  ['mood', '心情与精力', Heart],
                  ['supplement', '补剂记录', Pill],
                  ['photo', '身体进展照片', Camera],
                  ['habit', '每日习惯', Check],
                ] as const
              ).map(([kind, label, Icon]) => (
                <button className="card lifestyle-button" key={kind} onClick={() => open(kind)}>
                  <span className="icon-box mint">
                    <Icon size={21} />
                  </span>
                  <strong>{label}</strong>
                  <ArrowUpRight size={16} />
                </button>
              ))}
            </div>
          </Section>
          <Section title="你的目标">
            <Card>
              <button className="settings-row" onClick={() => open('goals')}>
                <SlidersHorizontal size={21} />
                <span>
                  <strong>饮食、饮水与运动目标</strong>
                  <small>
                    {profile.calories} kcal · {profile.water} ml · 每周 {profile.workouts} 次
                  </small>
                </span>
                <ArrowUpRight size={17} />
              </button>
              <button className="settings-row" onClick={() => open('goals')}>
                <Scale size={21} />
                <span>
                  <strong>个人资料与单位</strong>
                  <small>
                    {profile.units === 'metric' ? '公制 · kg / cm' : '英制 · lb / in'} · 睡眠目标{' '}
                    {profile.sleep} 小时
                  </small>
                </span>
                <ArrowUpRight size={17} />
              </button>
            </Card>
          </Section>
          <Section title="个性化">
            <Card>
              <button className="settings-row" onClick={() => open('avatar')}>
                <Camera size={21} />
                <span>
                  <strong>选择头像</strong>
                  <small>图案或自己的照片，仅保存在本机</small>
                </span>
                <ArrowUpRight size={17} />
              </button>
              <button className="settings-row" onClick={() => open('weather')}>
                <Sun size={21} />
                <span>
                  <strong>天气与城市</strong>
                  <small>{profile.weatherLocation?.name ?? '选择城市后自动获取天气'}</small>
                </span>
                <ArrowUpRight size={17} />
              </button>
            </Card>
          </Section>
          <Section title="外观与语言">
            <Card>
              <div className="setting-block">
                <span>外观</span>
                <div className="segmented">
                  {(
                    [
                      ['system', '跟随系统', Monitor],
                      ['light', '浅色', Sun],
                      ['dark', '深色', Moon],
                    ] as const
                  ).map(([theme, label, Icon]) => (
                    <button
                      key={theme}
                      className={profile.theme === theme ? 'selected' : ''}
                      onClick={() => attempt(() => repository.profile({ ...profile, theme }))}
                    >
                      <Icon size={15} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="setting-block">
                <label htmlFor="language">导航语言</label>
                <select
                  id="language"
                  value={profile.language}
                  onChange={(e) =>
                    attempt(() =>
                      repository.profile({
                        ...profile,
                        language: e.target.value as Preferences['language'],
                      }),
                    )
                  }
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="en">English navigation (中文内容)</option>
                </select>
                <p className="footnote">
                  目前以简体中文为完整体验，英文导航已准备；完整英文表单仍待翻译。
                </p>
              </div>
            </Card>
          </Section>
        </div>
        <div>
          <Section title="数据，由你掌握">
            <Card>
              <button className="settings-row" onClick={() => open('backup')}>
                <Download size={21} />
                <span>
                  <strong>备份与恢复</strong>
                  <small>
                    {profile.lastBackup
                      ? '最近导出：' + new Date(profile.lastBackup).toLocaleDateString()
                      : '尚未导出备份 · 建议定期备份'}
                  </small>
                </span>
                <ArrowUpRight size={17} />
              </button>
              <button className="settings-row" onClick={() => open('install')}>
                <Smartphone size={21} />
                <span>
                  <strong>安装到电脑 / 手机</strong>
                  <small>添加到程序坞或主屏幕</small>
                </span>
                <ArrowUpRight size={17} />
              </button>
              <button
                className="settings-row"
                onClick={() =>
                  attempt(async () => {
                    const granted = await navigator.storage?.persist?.();
                    notify(
                      granted ? '浏览器已授予持久储存' : '浏览器未授予持久储存，仍建议定期导出备份',
                    );
                  })
                }
              >
                <HardDrive size={21} />
                <span>
                  <strong>请求持久储存</strong>
                  <small>是否批准取决于浏览器</small>
                </span>
                <ArrowUpRight size={17} />
              </button>
            </Card>
            <Card className="storage-note">
              <ShieldCheck size={23} />
              <h3>私密，是默认设置。</h3>
              <p>
                健康记录与位置数据保存在此设备的 IndexedDB
                中。没有广告、追踪器或自动云同步。导出的文件含敏感记录，请妥善保管。
              </p>
              <p>
                清除浏览器数据、储存空间不足或更换设备可能导致记录丢失。主屏幕应用与 Safari
                也可能使用独立储存。请在同一入口使用，并定期导出 JSON 备份。
              </p>
            </Card>
          </Section>
          <Section title="最近的生活记录">
            <Card>
              {entries.filter((e) => !['meal', 'water', 'workout'].includes(e.kind)).length ? (
                <EntryList
                  entries={entries
                    .filter((e) => !['meal', 'water', 'workout'].includes(e.kind))
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .slice(0, 12)}
                />
              ) : (
                <div className="empty">
                  <p>
                    体重、睡眠、心情……
                    <br />
                    慢慢记录，慢慢了解自己。
                  </p>
                </div>
              )}
            </Card>
          </Section>
          <button
            className="delete-data"
            onClick={() => {
              if (
                prompt(
                  '此操作将永久删除此设备的全部 WHIP 记录、食物和设置。建议先备份。输入「删除全部数据」继续：',
                ) === '删除全部数据'
              )
                void attempt(() => repository.clear(), '本地数据已删除');
            }}
          >
            <Trash2 size={15} />
            永久删除本地数据
          </button>
        </div>
      </div>
      <footer className="app-footer">
        <span className="wordmark">WHIP</span>
        <p>
          Personal Discipline OS · 1.2.0
          <br />
          照顾自己，是一件值得慢慢做的事。
        </p>
      </footer>
    </>
  );
}
