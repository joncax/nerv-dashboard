import { useState } from 'react';
import { useQuery } from 'react-query';
import { fetchAllAppsInfo, triggerUpdateFetch } from '../api/client';
import { AppUpdateInfo } from '../types';

const APP_COLORS: Record<string, { bg: string; color: string }> = {
  jellyfin:     { bg: '#0d2a3a', color: '#4fc3f7' },
  sonarr:       { bg: '#0d1f2e', color: '#81d4fa' },
  radarr:       { bg: '#0d2a0d', color: '#81c784' },
  bazarr:       { bg: '#1e0d2a', color: '#ce93d8' },
  prowlarr:     { bg: '#2a1f0d', color: '#ffb74d' },
  transmission: { bg: '#2a0d0d', color: '#ef9a9a' },
  filebrowser:  { bg: '#0d2a1a', color: '#80cbc4' },
};

function shortDigest(digest: string | null): string {
  if (!digest) return '\u2014';
  return digest.replace('sha256:', '').slice(0, 12);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface DrawerProps {
  app: AppUpdateInfo;
  onClose: () => void;
}

function UpdateDrawer({ app, onClose }: DrawerProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = () => {
    setLines([]);
    setRunning(true);
    setDone(false);
    setError(null);
    triggerUpdateFetch(
      app.name,
      (line) => setLines(prev => [...prev, line]),
      () => { setRunning(false); setDone(true); },
      (err) => { setRunning(false); setError(err); }
    );
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <div className="drawer-title">Update — {app.name}</div>
            <div className="drawer-subtitle">{app.image}</div>
          </div>
          <button className="icon-btn" onClick={onClose}>&#x2715;</button>
        </div>

        <div className="drawer-body">
          <div className="drawer-info-row">
            <span className="drawer-info-label">Local digest</span>
            <span className="drawer-info-value mono">{shortDigest(app.local_digest)}</span>
          </div>
          {app.github && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="drawer-info-row">
                <span className="drawer-info-label">Latest version</span>
                <span className="drawer-info-value">{app.github.latest_version}</span>
              </div>
              <div className="drawer-info-row">
                <span className="drawer-info-label">Published</span>
                <span className="drawer-info-value">{formatDate(app.github.published_at)}</span>
              </div>
              
                <a className="drawer-rn-link"
                href={app.github.release_url}
                target="_blank"
                rel="noreferrer"
              >
                Release Notes &#x2197;
              </a>
            </div>
          )}
        </div>

        {lines.length > 0 && (
          <div className="drawer-terminal">
            {lines.map((line, i) => (
              <div key={i} className="terminal-line">{line}</div>
            ))}
            {running && <div className="terminal-line terminal-cursor">&#x258c;</div>}
          </div>
        )}

        {error && (
          <div className="drawer-error">Erro: {error}</div>
        )}

        <div className="drawer-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          {!done ? (
            <button
              className="btn-primary"
              onClick={handleUpdate}
              disabled={running}
            >
              {running ? 'A actualizar...' : 'Confirmar Update'}
            </button>
          ) : (
            <button className="btn-success" disabled>Concluido</button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AppsPage() {
  const { data, isLoading, refetch } = useQuery('appsInfo', fetchAllAppsInfo, {
    refetchInterval: false,
    staleTime: 60000,
  });
  const [selectedApp, setSelectedApp] = useState<AppUpdateInfo | null>(null);

  const apps = data?.apps ?? [];

  return (
    <div>
      <div className="apps-page-header">
        <span className="section-label" style={{ marginBottom: 0 }}>Gestao de Apps</span>
        <button className="icon-btn" onClick={() => refetch()} title="Refresh">&#x21BA;</button>
      </div>

      <div className="table-card" style={{ marginTop: '0.75rem' }}>
        <table>
          <thead>
            <tr>
              <th>App</th>
              <th>Imagem</th>
              <th>Digest local</th>
              <th>Ultima versao</th>
              <th>Publicada</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                  A carregar...
                </td>
              </tr>
            )}
            {apps.map(app => {
              const colors = APP_COLORS[app.name] ?? { bg: 'rgba(255,255,255,0.06)', color: '#888899' };
              const initials = app.name.slice(0, 2).toUpperCase();
              return (
                <tr key={app.name}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="app-icon" style={{ background: colors.bg, color: colors.color, flexShrink: 0 }}>
                        {initials}
                      </div>
                      <span style={{ fontWeight: 500 }}>{app.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {app.image.split('/').pop()}
                    </span>
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      {shortDigest(app.local_digest)}
                    </span>
                  </td>
                  <td>
                    {app.github ? (
                      <a
                        href={app.github.release_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '11px', color: '#4fc3f7', textDecoration: 'none' }}
                      >
                        {app.github.latest_version}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>\u2014</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                    {app.github ? formatDate(app.github.published_at) : '\u2014'}
                  </td>
                  <td>
                    <button
                      className="btn-update"
                      onClick={() => setSelectedApp(app)}
                    >
                      Update
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedApp && (
        <UpdateDrawer
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  );
}
