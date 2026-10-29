import { useEffect, useState } from 'react';
import { Mail, LockKeyhole, ArrowUpRight, ShieldCheck, UserRound } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import {
  authClient,
  authConfigured,
  authError,
  authRedirect,
  isPasswordRecovery,
} from '../lib/auth';
import { Field } from '../components/ui';
export function Account() {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset' | 'update'>(
      isPasswordRecovery ? 'update' : 'login',
    ),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    if (!authClient) return;
    let alive = true;
    void authClient.auth.getUser().then(({ data }) => {
      if (alive) setUser(data.user);
    });
    const { data } = authClient.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') setMode('update');
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!authClient || busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      let result;
      if (mode === 'signup') {
        result = await authClient.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: authRedirect() },
        });
        if (result.error) throw result.error;
        setMessage('注册请求已提交。若此邮箱可用，请查看邮箱中的确认链接。');
      } else if (mode === 'reset') {
        result = await authClient.auth.resetPasswordForEmail(email, { redirectTo: authRedirect() });
        if (result.error) throw result.error;
        setMessage('如果此邮箱存在账户，你会收到密码重置链接。');
      } else if (mode === 'update') {
        result = await authClient.auth.updateUser({ password });
        if (result.error) throw result.error;
        setMessage('密码已更新。');
        setMode('login');
      } else {
        result = await authClient.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        setUser(result.data.user);
        setMessage('登录成功。健康记录仍保存在当前设备。');
      }
      setPassword('');
    } catch (e) {
      setError(authError(e instanceof Error ? e.message : '操作失败，请重试'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="account-panel">
      <div className="account-emblem">
        <UserRound size={32} />
      </div>
      <span className="eyebrow">YOUR PERSONAL SPACE</span>
      <h3>
        {user && mode !== 'update'
          ? '欢迎回来。'
          : mode === 'reset'
            ? '找回你的账户。'
            : mode === 'update'
              ? '设置新密码。'
              : '让关照，有一个归属。'}
      </h3>
      <p className="muted">可选的 WHIP 账户。每一天，依然由你掌握。</p>
      {!authConfigured && (
        <div className="callout auth-notice">
          <ShieldCheck size={20} />
          <div>
            <strong>登录界面已就绪 · 身份服务尚未连接</strong>
            <p>
              按你的选择，暂未创建 Supabase
              项目。接入免费身份服务后，才可以注册和跨设备登录。现在可继续完整使用本机记录。
            </p>
          </div>
        </div>
      )}
      {user && mode !== 'update' ? (
        <div className="account-session">
          <Mail size={20} />
          <strong>{user.email}</strong>
          <p>登录身份可跨设备；健康记录不会因此上传或同步。</p>
          <button
            disabled={busy}
            className="button secondary full-width"
            onClick={async () => {
              setBusy(true);
              const result = await authClient!.auth.signOut();
              setBusy(false);
              if (result.error) setError(authError(result.error.message));
              else setUser(null);
            }}
          >
            退出账户
          </button>
        </div>
      ) : (
        <>
          <div className="pills account-tabs">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                className={mode === m ? 'selected' : ''}
                onClick={() => {
                  setMode(m);
                  setError('');
                  setMessage('');
                }}
              >
                {m === 'login' ? '登录' : '创建账户'}
              </button>
            ))}
          </div>
          <form onSubmit={submit}>
            {mode !== 'update' && (
              <Field label="邮箱">
                <div className="input-with-icon">
                  <Mail size={18} />
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </Field>
            )}
            {mode !== 'reset' && (
              <Field
                label="密码"
                hint={
                  mode === 'signup' || mode === 'update'
                    ? '至少 8 位。请为 WHIP 使用独立密码。'
                    : undefined
                }
              >
                <div className="input-with-icon">
                  <LockKeyhole size={18} />
                  <input
                    required
                    type="password"
                    minLength={mode === 'login' ? 1 : 8}
                    maxLength={128}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder="输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </Field>
            )}
            <button disabled={!authConfigured || busy} className="button primary full-width">
              {busy
                ? '连接中…'
                : !authConfigured
                  ? '等待连接身份服务'
                  : mode === 'reset'
                    ? '发送重置链接'
                    : mode === 'update'
                      ? '更新密码'
                      : mode === 'signup'
                        ? '创建我的账户'
                        : '登录 WHIP'}
              <ArrowUpRight size={18} />
            </button>
            {mode === 'login' && (
              <button type="button" className="text-button" onClick={() => setMode('reset')}>
                忘记密码？
              </button>
            )}
          </form>
        </>
      )}
      {message && (
        <div className="callout" role="status">
          {message}
        </div>
      )}
      {error && (
        <div className="inline-error" role="alert">
          {error}
        </div>
      )}
      <p className="source-note account-privacy">
        <ShieldCheck size={15} />
        登录仅用于身份验证。饮食、照片、身体和自律记录继续只保存在本机；换设备请使用备份恢复。
      </p>
    </div>
  );
}
