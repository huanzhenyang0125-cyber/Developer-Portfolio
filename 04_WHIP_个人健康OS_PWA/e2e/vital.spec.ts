import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
async function ready(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: '开启我的健康空间', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: '给身体，多一点关照。', exact: true }),
  ).toBeVisible();
}
const nav = (page: import('@playwright/test').Page) => page.locator('nav:visible');
test('真实饮水、份量计算与刷新持久化', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: '+250 ml', exact: true }).click();
  await page.getByRole('button', { name: '快速记录', exact: true }).click();
  await page.getByRole('button', { name: '饮食 认真吃一餐', exact: true }).click();
  await page.getByRole('textbox', { name: '搜索食物', exact: true }).fill('mifan');
  await page.getByRole('button', { name: /熟白米饭 参考数据库/ }).click();
  await page.getByLabel('实际份量 (g)').fill('150');
  await page.getByRole('button', { name: '确认记录', exact: true }).click();
  await expect(page.getByRole('button', { name: /熟白米饭.*195 kcal/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: /熟白米饭.*195 kcal/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /白水.*250 ml/ })).toBeVisible();
});
test('五页与空数据趋势、目标编辑', async ({ page }) => {
  await ready(page);
  await nav(page).getByRole('button', { name: '趋势', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: '趋势，始于日积月累', exact: true }),
  ).toBeVisible();
  await nav(page).getByRole('button', { name: '运动', exact: true }).click();
  await expect(page.getByRole('heading', { name: '动作资料库', exact: true })).toBeVisible();
  await nav(page).getByRole('button', { name: '我的', exact: true }).click();
  await page.getByRole('button', { name: '编辑个人目标', exact: true }).click();
  await page.getByLabel('每日热量 (kcal)').fill('2200');
  await page.getByRole('button', { name: '保存个人目标', exact: true }).click();
  await nav(page).getByRole('button', { name: '今日', exact: true }).click();
  await expect(page.getByText('2,200', { exact: true })).toBeVisible();
  await nav(page).getByRole('button', { name: '饮食', exact: true }).click();
  await expect(page.getByRole('button', { name: '添加食物', exact: true })).toBeVisible();
});
test('JSON 导出与重复合并不增加记录', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: '+250 ml', exact: true }).click();
  await nav(page).getByRole('button', { name: '我的', exact: true }).click();
  await page.getByRole('button', { name: /备份与恢复/ }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /导出完整 JSON 备份/ }).click();
  const file = await download;
  const path = await file.path();
  const bytes = await readFile(path!);
  const backup = JSON.parse(bytes.toString());
  expect(backup.app).toBe('VITAL');
  expect(backup.entries).toHaveLength(1);
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'synthetic-backup.json', mimeType: 'application/json', buffer: bytes });
  await expect(page.getByRole('heading', { name: '已校验备份' })).toBeVisible();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: '确认恢复', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('0 条新记录');
});
