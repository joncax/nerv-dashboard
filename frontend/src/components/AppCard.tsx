import { useState } from 'react';
import { App } from '../types';

interface AppCardProps {
  app: App;
  onRestart: (app: App) => void;
}

export function AppCard({ app, onRestart }: AppCardProps) {
  const [isDev, setIsDev] = useState(false);

  const initials = app.namespace.slice(0, 2).toUpperCase();
  const activePort = isDev && app.dev_port ? app.dev_port : app.prod_port;
  const activeUrl = `http://${app.ip}:${activePort}`;

  return (
    <div className="app-card">
      <div className="app-top">
        <div className="app-icon" style={{ background: app.color_bg, color: app.color_fg }}>
          {initials}
        </div>
        <div className="app-right">
          <div className="app-dot">
            <div className={`dot ${app.healthy ? 'dot-green' : 'dot-red'}`}></div>
            <span className={`dot-label ${app.healthy ? 'dot-up' : 'dot-down'}`}>
              {app.healthy ? 'online' : 'offline'}
            </span>
          </div>
          <button className="icon-btn" title="restart pod" onClick={() => onRestart(app)}>↺</button>
        </div>
      </div>
      <div className="app-name">{app.namespace}</div>
      <div className="app-links">
        <a className="app-link" href={activeUrl} target="_blank" rel="noreferrer">
          {app.ip}:{activePort}
        </a>
        {app.last_update && (
          <div className="app-last-update">Last update: {app.last_update}</div>
        )}
      </div>
      {app.has_dev && (
        <div className="app-env-toggle">
          <button
            className={`env-btn ${!isDev ? 'env-active' : ''}`}
            onClick={() => setIsDev(false)}
          >
            prod
          </button>
          <button
            className={`env-btn ${isDev ? 'env-active' : ''}`}
            onClick={() => setIsDev(true)}
          >
            dev
          </button>
        </div>
      )}
    </div>
  );
}