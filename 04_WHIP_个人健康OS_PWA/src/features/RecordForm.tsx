import { useState } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import type { Entry, Kind, Preferences } from '../lib/types';
import { makeEntry, shiftDay, sleepHours, fmt } from '../lib/domain';
import { repository, db } from '../lib/db';
import { useUI, attempt } from '../lib/store';
import { Field } from '../components/ui';
import { EntryActions } from './FoodForm';
import { RouteView } from './Activity';
import { exercises } from '../lib/catalog';
export function RecordForm({ kind, profile }: { kind: Kind; profile: Preferences }) {
  const { edit, day, close } = useUI();
  const [date, setDate] = useState(edit?.date ?? day),
    [name, setName] = useState(
      edit?.name ??
        {
          water: '白水',
          workout: '力量训练',
          body: '体重',
          sleep: '睡眠',
          mood: '还不错',
          supplement: '',
          habit: profile.habits[0],
          photo: '身体进展照片',
          protocol: '自律记录',
          meal: '',
        }[kind],
    ),
    [amount, setAmount] = useState<string>(
      edit?.amount != null
        ? String(
            kind === 'body' && profile.units === 'imperial' ? edit.amount * 2.20462 : edit.amount,
          )
        : kind === 'water'
          ? '250'
          : kind === 'mood'
            ? '4'
            : '',
    ),
    [notes, setNotes] = useState(edit?.notes ?? ''),
    [duration, setDuration] = useState(String(edit?.duration != null ? edit.duration / 60 : 30)),
    [distance, setDistance] = useState(edit?.distance ? String(edit.distance / 1000) : ''),
    [start, setStart] = useState(edit?.bedtime ?? shiftDay(date, -1) + 'T23:00'),
    [end, setEnd] = useState(edit?.wakeTime ?? date + 'T07:00'),
    [energy, setEnergy] = useState(edit?.energy ?? 3),
    [waist, setWaist] = useState(
      edit?.waist ? String(edit.waist * (profile.units === 'imperial' ? 1 / 2.54 : 1)) : '',
    ),
    [bodyFat, setBodyFat] = useState(edit?.bodyFat ? String(edit.bodyFat) : ''),
    [volumeUnit, setVolumeUnit] = useState('ml'),
    [dosage, setDosage] = useState(edit?.unit ?? ''),
    [sets, setSets] = useState(edit?.sets ?? []),
    [photo, setPhoto] = useState(edit?.photo ?? ''),
    [estimatedCalories, setEstimatedCalories] = useState(
      edit?.estimatedCalories ? String(edit.estimatedCalories) : '',
    ),
    [rpe, setRpe] = useState(edit?.rpe ?? 5),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const ok = await attempt(async () => {
      const record: Entry = {
        ...(edit ?? makeEntry(kind, name, date)),
        name: name.trim(),
        date,
        notes,
      };
      if (!record.name) throw Error('请填写记录名称');
      if (kind === 'water') {
        record.amount = Number(amount) * (volumeUnit === 'oz' ? 29.5735295625 : 1);
        record.unit = 'ml';
        record.category = name === '白水' ? 'water' : 'other';
        if (!record.amount || record.amount > 10000) throw Error('请输入 1–10000 ml 的饮水量');
      }
      if (kind === 'body') {
        record.amount = Number(amount) / (profile.units === 'imperial' ? 2.20462 : 1);
        record.unit = 'kg';
        record.waist = waist
          ? Number(waist) * (profile.units === 'imperial' ? 2.54 : 1)
          : undefined;
        record.bodyFat = bodyFat ? Number(bodyFat) : undefined;
        if (!record.amount || record.amount > 700) throw Error('请输入有效体重');
      }
      if (kind === 'sleep') {
        record.duration = sleepHours(start, end);
        record.bedtime = start;
        record.wakeTime = end;
        record.date = end.slice(0, 10);
      }
      if (kind === 'mood') {
        record.amount = Number(amount);
        record.unit = '/ 5';
        record.energy = energy;
        record.name = ['', '有些低落', '不太好', '平静', '还不错', '很愉快'][Number(amount)];
      }
      if (kind === 'supplement') {
        record.unit = dosage;
      }
      if (kind === 'photo') {
        if (!photo) throw Error('请先选择一张照片');
        record.photo = photo;
      }
      if (kind === 'habit' && !edit) {
        const existing = await db.entries
          .where('date')
          .equals(date)
          .filter((e) => e.kind === 'habit' && e.name === record.name)
          .first();
        if (existing) throw Error('这个习惯今天已经完成记录了');
      }
      if (kind === 'workout') {
        record.duration = Number(duration) * 60;
        record.distance = record.route?.length
          ? record.distance
          : distance
            ? Number(distance) * 1000
            : undefined;
        record.sets = sets;
        record.rpe = rpe;
        record.estimatedCalories = estimatedCalories ? Number(estimatedCalories) : undefined;
        record.status = 'done';
        record.activityType = edit?.activityType ?? 'manual';
        if (record.duration <= 0) throw Error('运动时长需大于 0');
      }
      await repository.save(record);
    }, '记录已保存');
    setBusy(false);
    if (ok) close();
  }
  async function choosePhoto(file?: File) {
    if (!file) return;
    if (file.size > 15000000) {
      useUI.getState().fail(Error('请选择小于 15 MB 的照片'));
      return;
    }
    await attempt(async () => {
      const url = URL.createObjectURL(file);
      try {
        const img = new Image();
        img.src = url;
        await img.decode();
        const ratio = Math.min(1, 1200 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL('image/jpeg', 0.8));
      } finally {
        URL.revokeObjectURL(url);
      }
    });
  }
  return (
    <form onSubmit={submit}>
      <div className="form-grid">
        <Field label="记录日期">
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        {!['mood', 'sleep', 'body'].includes(kind) && (
          <Field
            label={
              kind === 'water'
                ? '饮品名称'
                : kind === 'supplement'
                  ? '补剂名称'
                  : kind === 'habit'
                    ? '习惯名称'
                    : '名称'
            }
          >
            <input
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              list={kind === 'habit' ? 'habit-list' : undefined}
            />
            {kind === 'habit' && (
              <datalist id="habit-list">
                {profile.habits.map((h) => (
                  <option key={h} value={h} />
                ))}
              </datalist>
            )}
          </Field>
        )}
        {kind === 'water' && (
          <>
            <Field label="饮水单位">
              <select value={volumeUnit} onChange={(e) => setVolumeUnit(e.target.value)}>
                <option value="ml">毫升 (ml)</option>
                <option value="oz">美制液体盎司 (fl oz)</option>
              </select>
            </Field>
            <Field label={volumeUnit === 'oz' ? '饮水量 (fl oz)' : '饮水量 (ml)'}>
              <input
                required
                type="number"
                min="1"
                max={volumeUnit === 'oz' ? 338 : 10000}
                step=".1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <div className="shortcut-buttons">
              {profile.waterShortcuts.map((a) => (
                <button
                  type="button"
                  className="button secondary"
                  key={a}
                  onClick={() => {
                    setVolumeUnit('ml');
                    setAmount(String(a));
                  }}
                >
                  {a} ml
                </button>
              ))}
            </div>
            <p className="footnote">
              可记录白水、茶和咖啡。饮水目标按总液体记录汇总；白水会在备份中按名称单独保留。1 美制
              fl oz ≈ 29.574 ml。
            </p>
          </>
        )}
        {kind === 'body' && (
          <>
            <Field label={'体重 (' + (profile.units === 'imperial' ? 'lb' : 'kg') + ')'}>
              <input
                required
                type="number"
                min="1"
                max={profile.units === 'imperial' ? 1500 : 700}
                step=".1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <Field label={'腰围，可选 (' + (profile.units === 'imperial' ? 'in' : 'cm') + ')'}>
              <input
                type="number"
                min="1"
                max="300"
                step=".1"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
              />
            </Field>
            <Field label="体脂率，可选 (%)">
              <input
                type="number"
                min="1"
                max="75"
                step=".1"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
              />
            </Field>
            <p className="footnote">趋势只反映你记录的测量。不同时间和设备的测量结果可能不同。</p>
          </>
        )}
        {kind === 'sleep' && (
          <>
            <Field label="入睡时间">
              <input
                type="datetime-local"
                required
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </Field>
            <Field label="醒来时间">
              <input
                type="datetime-local"
                required
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </Field>
            <div className="callout">
              {new Date(end) > new Date(start)
                ? `睡眠时长 ${fmt((new Date(end).getTime() - new Date(start).getTime()) / 3600000, 1)} 小时`
                : '请检查入睡与醒来时间'}{' '}
              · 按醒来日期归档
            </div>
          </>
        )}
        {kind === 'mood' && (
          <>
            <Field label="现在的心情">
              <select value={amount || '4'} onChange={(e) => setAmount(e.target.value)}>
                {['有些低落', '不太好', '平静', '还不错', '很愉快'].map((x, i) => (
                  <option key={x} value={i + 1}>
                    {i + 1} · {x}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="精力水平">
              <select value={energy} onChange={(e) => setEnergy(Number(e.target.value))}>
                {['很疲惫', '稍显疲惫', '一般', '有精神', '精力充沛'].map((x, i) => (
                  <option key={x} value={i + 1}>
                    {i + 1} · {x}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}
        {kind === 'supplement' && (
          <>
            <Field label="你实际记录的剂量">
              <input
                required
                maxLength={100}
                placeholder="例如：1 片（按自己包装记录）"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
              />
            </Field>
            <p className="footnote">仅用于个人记录，不提供剂量建议、诊断或治疗建议。</p>
          </>
        )}
        {kind === 'photo' && (
          <>
            <Field label="选择进展照片">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                onChange={(e) => choosePhoto(e.target.files?.[0])}
              />
            </Field>
            {photo && <img className="progress-photo" src={photo} alt="你的身体进展照片" />}
            <p className="footnote">
              照片会在设备上缩小后保存，不上传服务器。JSON 备份包含照片，请私密保管。
            </p>
          </>
        )}
        {kind === 'workout' && (
          <>
            <Field label="运动时长（分钟）">
              <input
                required
                type="number"
                min=".1"
                max="1440"
                step=".1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </Field>
            <Field label="距离，可选 (km)">
              <input
                readOnly={!!edit?.route?.length}
                type="number"
                min="0"
                max="1000"
                step=".01"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
            </Field>
            <Field
              label="活动能量估算，可选 (kcal)"
              hint="仅保存你手动录入的估算，不加入饮食额度。"
            >
              <input
                type="number"
                min="0"
                max="10000"
                value={estimatedCalories}
                onChange={(e) => setEstimatedCalories(e.target.value)}
              />
            </Field>
            <Field label="主观强度 RPE (1–10)">
              <input
                type="number"
                min="1"
                max="10"
                value={rpe}
                onChange={(e) => setRpe(Number(e.target.value))}
              />
            </Field>
          </>
        )}
      </div>
      {kind === 'workout' && (
        <>
          <h3>力量训练组</h3>
          {sets.map((s, i) => (
            <div className="manual-set" key={i}>
              <select
                aria-label="动作名称"
                value={s.exercise}
                onChange={(e) =>
                  setSets(sets.map((x, j) => (i === j ? { ...x, exercise: e.target.value } : x)))
                }
              >
                {exercises
                  .filter((e) => e.type === 'strength')
                  .map((e) => (
                    <option key={e.name}>{e.name}</option>
                  ))}
              </select>
              <div className="set-inputs">
                <input
                  aria-label="重量 kg"
                  required
                  type="number"
                  min="0"
                  max="1000"
                  step=".5"
                  value={s.weight}
                  onChange={(e) =>
                    setSets(
                      sets.map((x, j) => (i === j ? { ...x, weight: Number(e.target.value) } : x)),
                    )
                  }
                />
                <small>kg ×</small>
                <input
                  aria-label="次数"
                  required
                  type="number"
                  min="1"
                  max="1000"
                  value={s.reps}
                  onChange={(e) =>
                    setSets(
                      sets.map((x, j) => (i === j ? { ...x, reps: Number(e.target.value) } : x)),
                    )
                  }
                />
                <small>次</small>
                <input
                  aria-label="组间休息秒数"
                  required
                  type="number"
                  min="0"
                  max="3600"
                  value={s.rest}
                  onChange={(e) =>
                    setSets(
                      sets.map((x, j) => (i === j ? { ...x, rest: Number(e.target.value) } : x)),
                    )
                  }
                />
                <small>秒</small>
                <button
                  type="button"
                  className="icon-button danger"
                  aria-label="移除训练组"
                  onClick={() => setSets(sets.filter((_, j) => j !== i))}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="button secondary"
            onClick={() =>
              setSets([
                ...sets,
                {
                  exercise: sets.at(-1)?.exercise ?? '杠铃卧推',
                  weight: sets.at(-1)?.weight ?? 0,
                  reps: 10,
                  done: true,
                  rest: 90,
                },
              ])
            }
          >
            <Plus size={16} />
            添加一组
          </button>
          {!!edit?.route?.length && <RouteView points={edit.route} />}
        </>
      )}
      <Field label="备注，可选">
        <textarea
          maxLength={2000}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="留下一点细节，给未来的自己。"
        />
      </Field>
      <button className="button primary full-width" disabled={busy}>
        <Check size={17} />
        {busy ? '保存中…' : edit ? '保存修改' : '保存记录'}
      </button>
      {edit &&
        (kind === 'workout' ? (
          <EntryActions entry={edit} />
        ) : (
          <div className="entry-actions">
            <button
              type="button"
              className="text-button danger"
              onClick={() => {
                if (confirm('删除这条记录？'))
                  void attempt(async () => {
                    await repository.remove(edit.id);
                    close();
                  }, '记录已删除');
              }}
            >
              删除记录
            </button>
          </div>
        ))}
    </form>
  );
}
