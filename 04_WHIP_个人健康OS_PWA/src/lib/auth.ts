import { createClient, type SupabaseClient } from '@supabase/supabase-js';
// Only publishable/anon keys belong in the browser. Never configure a service-role key.
export const isPasswordRecovery = location.hash.includes('type=recovery');
const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';
function publicKey(value: string) {
  if (value.startsWith('sb_publishable_')) return true;
  try {
    return JSON.parse(atob(value.split('.')[1])).role === 'anon';
  } catch {
    return false;
  }
}
export const authConfigured =
  !!url && /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) && publicKey(key);
export const authClient: SupabaseClient | null = authConfigured
  ? createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
export const authRedirect = () => location.origin + location.pathname;
export function authError(message: string) {
  if (/invalid login credentials/i.test(message)) return '邮箱或密码不正确，请重试。';
  if (/email not confirmed/i.test(message)) return '请先打开邮箱中的确认链接。';
  if (/rate limit/i.test(message)) return '请求过于频繁，请稍后重试。';
  if (/fetch|network/i.test(message)) return '连接失败，请检查网络后重试。';
  return message;
}
