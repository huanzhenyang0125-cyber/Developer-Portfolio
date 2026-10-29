import type { Entry } from './types';
export const protocolCopy = {
  masturbation: {
    label: '个人规则事件',
    en: 'You set the rule. You crossed it. No bargaining. Put the phone down, leave this spot, and take back the next ten minutes.',
    zh: '规则是你定的，刚才也是你越过的。别拿“最后一次”给冲动盖章。现在放下手机，离开这个位置，守住接下来的十分钟。',
  },
  'sugary-drink': {
    label: '含糖饮料事件',
    en: 'You said you would limit sugary drinks. Stop dressing up an excuse as a plan. Log this honestly, stop here, and choose water next time.',
    zh: '你说要控制含糖饮料，转头又在为这一瓶找理由？别把“就这一次”说成计划。诚实记录，到这里停，下一次选白水。',
  },
  resisted: {
    label: '成功抵抗诱惑',
    en: 'One deliberate choice. Keep going.',
    zh: '少说狠话，多留证据。这一次你停下了，继续执行。',
  },
};
export const sugarAmount = (ml: number, per100: number) => (ml * per100) / 100;
export const sugarCubes = (grams: number) => grams / 4;
export function elapsedSince(at: string, now = Date.now()) {
  const delta = Math.max(0, now - Date.parse(at));
  if (!Number.isFinite(delta)) return '—';
  const minutes = Math.floor(delta / 60000);
  return `${Math.floor(minutes / 1440)}天 ${Math.floor(minutes / 60) % 24}时 ${minutes % 60}分`;
}
export function latestLapse(entries: Entry[]) {
  return entries
    .filter((e) => e.kind === 'protocol' && e.eventType !== 'resisted' && e.occurredAt)
    .sort((a, b) => Date.parse(b.occurredAt!) - Date.parse(a.occurredAt!))[0];
}
export const interruptionCopy = {
  urge: {
    title: '别再和冲动讨价还价。',
    zh: '“最后一次”不是计划，是你正在重复的借口。规则是你定的，现在就执行。把手机放远，离开这个位置，守住接下来的十分钟。',
    steps: [
      '放下手机，停止继续浏览触发内容。',
      '站起来，离开当前的私密位置。',
      '喝一杯水，选择一件明确的小任务。',
    ],
  },
  night: {
    title: '别再把明天，交给这块屏幕。',
    zh: '你说明天要清醒，手却还在往下划。再看一分钟的借口已经够多了。现在停，给设备充电，结束今晚的浏览。',
    steps: [
      '停止当前视频或信息流。',
      '把设备放到床外，调暗环境。',
      '开始收尾休息，不再找下一个内容。',
    ],
  },
};
