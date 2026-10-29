import { Orbit, Mountain, Waves, UserRound, Dribbble, Check, Upload, Type } from 'lucide-react';
import { useState, useRef } from 'react';
import type { Preferences } from '../lib/types';
import { repository } from '../lib/db';
import { useUI, attempt } from '../lib/store';
import { Field } from './ui';
export const avatarStyles = ['initials', 'orbit', 'mountain', 'wave', 'court'] as const;
const presets = {
  initials: { label: '姓名首字', Icon: Type },
  orbit: { label: '轨道', Icon: Orbit },
  mountain: { label: '山峰', Icon: Mountain },
  wave: { label: '海浪', Icon: Waves },
  court: { label: '球场', Icon: Dribbble },
};
export function Avatar({ profile, className = '' }: { profile: Preferences; className?: string }) {
  const style = profile.avatarStyle ?? 'initials';
  const Icon = presets[style]?.Icon ?? UserRound;
  return (
    <span className={'avatar-visual avatar-' + style + ' ' + className}>
      {profile.avatar ? (
        <img src={profile.avatar} alt="个人头像" />
      ) : style === 'initials' ? (
        <span>{profile.name?.slice(0, 1) || 'V'}</span>
      ) : (
        <Icon size={27} strokeWidth={1.5} aria-hidden="true" />
      )}
    </span>
  );
}
export function AvatarPicker({ profile }: { profile: Preferences }) {
  const [selected, setSelected] = useState<Preferences['avatarStyle']>(
    profile.avatarStyle ?? 'initials',
  );
  const [photo, setPhoto] = useState(profile.avatar ?? '');
  const [busy, setBusy] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const close = useUI((s) => s.close);
  async function read(file?: File) {
    if (!file) return;
    setBusy(true);
    await attempt(async () => {
      if (file.size > 15000000) throw Error('请选择小于 15 MB 的照片');
      if (!/^image\//.test(file.type)) throw Error('请选择图片文件');
      const url = URL.createObjectURL(file);
      try {
        const img = new Image();
        img.src = url;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const side = Math.min(img.width, img.height);
        canvas
          .getContext('2d')!
          .drawImage(
            img,
            (img.width - side) / 2,
            (img.height - side) / 2,
            side,
            side,
            0,
            0,
            256,
            256,
          );
        setPhoto(canvas.toDataURL('image/jpeg', 0.85));
      } finally {
        URL.revokeObjectURL(url);
      }
    });
    setBusy(false);
  }
  return (
    <form
      className="avatar-picker"
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        void attempt(async () => {
          await repository.profile({
            ...profile,
            avatarStyle: selected,
            avatar: photo || undefined,
          });
          close();
        }, '头像已更新').finally(() => setBusy(false));
      }}
    >
      <div className="avatar-preview">
        <Avatar profile={{ ...profile, avatarStyle: selected, avatar: photo || undefined }} />
        <h3>一个属于你的标记</h3>
        <p>头像仅保存在此设备，不上传。</p>
      </div>
      <div className="avatar-options">
        {avatarStyles.map((style) => {
          const p = { ...profile, avatar: undefined, avatarStyle: style };
          return (
            <button
              type="button"
              className={selected === style && !photo ? 'selected' : ''}
              aria-label={'选择' + presets[style].label + '头像'}
              aria-pressed={selected === style && !photo}
              key={style}
              onClick={() => {
                setSelected(style);
                setPhoto('');
              }}
            >
              <Avatar profile={p} />
              <span>{presets[style].label}</span>
              {selected === style && !photo && <Check size={13} />}
            </button>
          );
        })}
      </div>
      <Field label="或选择自己的照片">
        <input
          ref={picker}
          type="file"
          accept="image/*"
          onChange={(e) => read(e.target.files?.[0])}
        />
      </Field>
      <p className="footnote">
        照片会在本机裁成正方形并缩小至 256 × 256。完整 JSON 备份会包含头像。
      </p>
      {photo && (
        <button type="button" className="text-button" onClick={() => setPhoto('')}>
          移除照片，使用图案头像
        </button>
      )}
      <button className="button primary full-width" disabled={busy}>
        <Check size={17} />
        {busy ? '处理中…' : '保存头像'}
      </button>
    </form>
  );
}
