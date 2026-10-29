import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initialize } from './lib/db';
import './styles.css';
import './refined.css';
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="boot">
        <h1>暂时无法打开健康空间</h1>
        <p>请重新打开应用。不要清除浏览器数据；已有记录可能仍在设备上。</p>
        <button className="button primary" onClick={() => location.reload()}>
          重新打开
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
const root = createRoot(document.getElementById('root')!);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
root.render(
  <div className="boot">
    <span className="wordmark">WHIP.</span>
    <p>正在打开本地健康空间…</p>
  </div>,
);
initialize()
  .then(() =>
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
    ),
  )
  .catch(() =>
    root.render(
      <div className="boot">
        <h1>无法访问本地储存</h1>
        <p>请关闭无痕模式、检查储存空间，再重新打开。未保存的操作不会被伪装为成功。</p>
        <button className="button primary" onClick={() => location.reload()}>
          重试
        </button>
      </div>,
    ),
  );
