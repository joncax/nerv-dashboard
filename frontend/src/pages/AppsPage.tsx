import { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { fetchAllAppsInfo, triggerUpdateFetch, verifyApp } from '../api/client';
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

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRecordedAt(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getAppStatus(app: AppUpdateInfo): 'updated' | 'outdated' | 'unknown' {
  if (!app.installed_version) return 'unknown';
  if (!app.github?.latest_version) return 'unknown';
  return app.installed_version === app.github.latest_version ? 'updated' : 'outdated';
}

function shortVersion(v: string): string {
  const parts = v.replace(/^v/, '').split('.');
  return 'v' + parts.slice(0, 3).join('.');
}

interface DrawerProps {
  app: AppUpdateInfo;
  onClose: () => void;
  onDone: () => void;
}

function UpdateDrawer({ app, onClose, onDone }: DrawerProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<string | null>(null);

  const status = getAppStatus(app);
  const colors = APP_COLORS[app.name] ?? { bg: 'rgba(255,255,255,0.06)', color: '#888899' };
  const initials = app.name.slice(0, 2).toUpperCase();

  const handleUpdate = () => {
    setLines([]);
    setRunning(true);
    setDone(false);
    setError(null);
    triggerUpdateFetch(
      app.name,
      (line) => setLines(prev => [...prev, line]),
      () => { setRunning(false); setDone(true); onDone(); },
      (err) => { setRunning(false); setError(err); }
    );
  };

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const result = await verifyApp(app.name);
      if (result.status === 'no_api') {
        setVerifyResult('no_api');
      } else if (result.status === 'ok' && result.version) {
        setVerifyResult(result.version);
        onDone();
      } else {
        setVerifyResult('error');
      }
    } catch {
      setVerifyResult('error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="app-icon" style={{ background: colors.bg, color: colors.color, flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <div className="drawer-title">{app.name}</div>
              <div className="drawer-subtitle" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px' }}>magi</div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}>&#x2715;</button>
        </div>

        <div className="drawer-body">
          {status === 'unknown' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="drawer-info-row">
                <span className="drawer-info-label">Installed version</span>
                <span className="drawer-info-value" style={{ color: 'var(--text-muted)' }}>unknown</span>
              </div>
              <div className="drawer-info-row">
                <span className="drawer-info-label">Latest version</span>
                <span className="drawer-info-value">{app.github?.latest_version ?? '—'}</span>
              </div>
              {app.github?.release_url && (
                <a className="drawer-rn-link" href={app.github.release_url} target="_blank" rel="noreferrer">
                  Release Notes &#x2197;
                </a>
              )}
              {verifyResult && verifyResult !== 'error' && verifyResult !== 'no_api' && (
                <div style={{ color: '#4caf50', fontSize: '13px' }}>
                  ✓ Version registered: {verifyResult}
                </div>
              )}
              {verifyResult === 'no_api' && (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  No version API available. Version will be registered after first update.
                </div>
              )}
              {verifyResult === 'error' && (
                <div style={{ color: '#ef5350', fontSize: '13px' }}>Could not determine version.</div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="drawer-info-card">
                  <div className="drawer-info-label">Installed version</div>
                  <div className="drawer-info-value mono">{app.installed_version}</div>
                  {app.installed_recorded_at && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      registered on {formatRecordedAt(app.installed_recorded_at)}
                    </div>
                  )}
                </div>
                <div className="drawer-info-card">
                  <div className="drawer-info-label">Available version</div>
                  <div className="drawer-info-value mono" style={{ color: status === 'outdated' ? '#ef5350' : '#4caf50' }}>
                    {app.github?.latest_version ?? '—'}
                  </div>
                  {app.github?.published_at && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      published on {formatDate(app.github.published_at)}
                    </div>
                  )}
                </div>
              </div>
              {app.github?.release_url && (
                <a className="drawer-rn-link" href={app.github.release_url} target="_blank" rel="noreferrer">
                  Release Notes — {app.github.latest_version} &#x2197;
                </a>
              )}
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

        {error && <div className="drawer-error">Error: {error}</div>}

        <div className="drawer-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          {status === 'unknown' && !verifyResult && (
            <button className="btn-verify" onClick={handleVerify} disabled={verifying}>
              {verifying ? 'Verifying...' : 'Verify'}
            </button>
          )}
          {status === 'outdated' && !done && (
            <button className="btn-primary" onClick={handleUpdate} disabled={running}>
              {running ? 'Updating...' : `Update to ${app.github?.latest_version}`}
            </button>
          )}
          {status === 'updated' && (
            <button className="btn-success" disabled>Updated</button>
          )}
          {done && (
            <button className="btn-success" disabled>Done</button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AppsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery('appsInfo', fetchAllAppsInfo, {
    refetchInterval: false,
    staleTime: 60000,
  });
  const [selectedApp, setSelectedApp] = useState<AppUpdateInfo | null>(null);

  const apps = data?.apps ?? [];

  const handleDone = () => {
    refetch();
    if (selectedApp) {
      queryClient.invalidateQueries('appsInfo');
    }
  };

  return (
    <div>
      <div className="apps-page-header">
        <span className="section-label" style={{ marginBottom: 0 }}>App Management</span>
        <button className="icon-btn" onClick={() => refetch()} title="Refresh">&#x21BA;</button>
      </div>

      <div className="table-card" style={{ marginTop: '0.75rem' }}>
        <table>
          <thead>
            <tr>
              <th>App</th>
              <th>Image</th>
              <th>Installed version</th>
              <th>Latest version</th>
              <th>Published</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                  Loading...
                </td>
              </tr>
            )}
            {apps.map(app => {
              const colors = APP_COLORS[app.name] ?? { bg: 'rgba(255,255,255,0.06)', color: '#888899' };
              const initials = app.name.slice(0, 2).toUpperCase();
              const status = getAppStatus(app);
              const latest = app.github?.latest_version ?? '';
              const installed = app.installed_version ?? '';

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
                    {app.installed_version ? (
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {app.installed_version}
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>unknown</span>
                    )}
                  </td>
                  <td>
                    {app.github ? (
                      <a href={app.github.release_url} target="_blank" rel="noreferrer"
                        style={{ fontSize: '11px', color: '#4fc3f7', textDecoration: 'none' }}>
                        {app.github.latest_version}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                    {app.github ? formatDate(app.github.published_at) : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {status === 'updated' && (
                      <button className="btn-status-updated" onClick={() => setSelectedApp(app)}>
                        ✓ Updated
                      </button>
                    )}
                    {status === 'unknown' && (
                      <button className="btn-status-verify" onClick={() => setSelectedApp(app)}>
                        Verify
                      </button>
                    )}
                    {status === 'outdated' && (
                      <button className="btn-status-update" onClick={() => setSelectedApp(app)}>
                        {shortVersion(installed)} → {shortVersion(latest)}
                      </button>
                    )}
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
          onDone={handleDone}
        />
      )}
    </div>
  );
}

