import { App } from '../types';
interface AppCardProps {
  app: App;
  onRestart: (app: App) => void;
}
const APP_COLORS: Record<string, { bg: string; color: string }> = {
  jellyfin:     { bg: '#0d2a3a', color: '#4fc3f7' },
  sonarr:       { bg: '#0d1f2e', color: '#81d4fa' },
  radarr:       { bg: '#0d2a0d', color: '#81c784' },
  bazarr:       { bg: '#1e0d2a', color: '#ce93d8' },
  prowlarr:     { bg: '#2a1f0d', color: '#ffb74d' },
  transmission: { bg: '#2a0d0d', color: '#ef9a9a' },
  filebrowser:  { bg: '#0d2a1a', color: '#80cbc4' },
};
export function AppCard({ app, onRestart }: AppCardProps) {
  const initials = app.name.slice(0, 2).toUpperCase();
  const colors = APP_COLORS[app.name.toLowerCase()] ?? { bg: 'rgba(255,255,255,0.06)', color: '#888899' };
  return (
    <div className="app-card">
      <div className="app-top">
        <div className="app-icon" style={{ background: colors.bg, color: colors.color }}>
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
      <div className="app-name">{app.name}</div>
      <div className="app-links">
        <a className="app-link" href={app.url_ip} target="_blank" rel="noreferrer">
          {app.ip}:{app.node_port}
        </a>
        {app.last_update && (
          <div className="app-last-update">Last update: {app.last_update}</div>
        )}
      </div>
    </div>
  );
}
