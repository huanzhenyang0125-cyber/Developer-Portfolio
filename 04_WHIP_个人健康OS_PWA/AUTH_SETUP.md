# 可选账户接入 — 当前不创建项目

当前版本提供真实 Supabase Auth 接入代码与登录、注册、邮箱确认、找回密码、新密码、退出流程。按用户最后选择，未创建任何 Supabase 项目，发布包不含身份服务配置。界面明确显示未连接，提交禁用，不模拟成功。

## 将来接入

1. 用户决定创建项目后，在自己的 Supabase 组织创建免费项目。此次未执行。
2. 在 Authentication → URL Configuration 设置正式 Site URL 为 `https://vital-personal-health-os-km22.huanzhenyang0125.chatgpt.site/`，将同一根网址加入 Redirect URLs；开发另加实际 localhost 端口。
3. 复制 `.env.example` 到 `.env.local`，填写 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_PUBLISHABLE_KEY`。仅允许项目 publishable key 或 legacy anon JWT；client 会拒绝 service_role。
4. `pnpm build` 后按既有 Sites 工作流重新发布。环境变量是构建时配置，修改后必须重建。
5. 用户亲自在真实项目验证注册确认邮件、登录、重置链接、新密码、登出和跨设备身份；当前没有后端，以上服务端联调尚未执行。不要由自动化工具填写真实密码。

账户只验证身份，不上传健康数据、不创建健康表、不实现健康云同步。登录状态由 Supabase 客户端管理，密码不存入 IndexedDB。更换设备仍需使用本机 JSON 备份恢复。天气城市和照片仍保留在设备，公开网站只发布代码与空白应用外壳。

参考官方接口：signInWithPassword、signUp、resetPasswordForEmail、updateUser、onAuthStateChange。依赖固定 @supabase/supabase-js 2.118.0。需要关注供应商免费额度与邮件速率限制，不能承诺无限量邮件。
