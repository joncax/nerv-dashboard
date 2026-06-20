import { useState } from 'react';
import { useQuery } from 'react-query';
import { fetchActivityLog } from '../api/client';
import { ActivityLogEntry } from '../types';

const APPS = ['jellyfin', 'sonarr', 'radarr', 'bazarr', 'prowlarr', 'transmission', 'filebrowser'];

const APP_COLORS: Record<string, { bg: string; color: string }> = {
  jellyfin:     { bg: '#0d2a3a', color: '#4fc3f7' },
  sonarr:       { bg: '#0d1f2e', color: '#81d4fa' },
  radarr:       { bg: '#0d2a0d', color: '#81c784' },
  bazarr:       { bg: '#1e0d2a', color: '#ce93d8' },
  prowlarr:     { bg: '#2a1f0d', color: '#ffb74d' },
  transmission: { bg: '#2a0d0d', color: '#ef9a9a' },
  filebrowser:  { bg: '#0d2a1a', color: '#80cbc4' },
};

function StatusBadge({ status }: { status: ActivityLogEntry['status'] }) {
  if (status === 'success') return (
    <span className="badge badge-healthy">success</span>
  );
  if (status === 'failed') return (
    <span className="badge badge-critical">failed</span>
  );
  return (
    <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>started</span>
  );
}

function formatTimestamp(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

export function ActivityLogPage() {
  const [filterApp, setFilterApp] = useState<string>('');
  const [limit, setLimit] = useState(50);

  const { data, isLoading, refetch } = useQuery(
    ['activityLog', filterApp, limit],
    () => fetchActivityLog(filterApp || undefined, limit),
    { refetchInterval: false, staleTime: 30000 }
  );

  const logs = data?.logs ?? [];

  return (
    <div>
      <div className="apps-page-header">
        <span className="section-label" style={{ marginBottom: 0 }}>Activity Log</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            className="refresh-select"
            value={filterApp}
            onChange={e => setFilterApp(e.target.value)}
          >
            <option value="">Todas as apps</option>
            {APPS.map(app => (
              <option key={app} value={app}>{app}</option>
            ))}
          </select>
          <select
            className="refresh-select"
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <button className="icon-btn" onClick={() => refetch()} title="Refresh">&#x21BA;</button>
        </div>
      </div>

      <div className="table-card" style={{ marginTop: '0.75rem' }}>
        {isLoading && (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            A carregar...
          </div>
        )}
        {!isLoading && logs.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            Sem entradas no log.
          </div>
        )}
        {logs.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Agente</th>
                <th>App</th>
                <th>Acao</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((entry, i) => {
                const { date, time } = formatTimestamp(entry.timestamp);
                const colors = APP_COLORS[entry.app] ?? { bg: 'rgba(255,255,255,0.06)', color: '#888899' };
                const initials = entry.app.slice(0, 2).toUpperCase();
                return (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-primary)' }}>{time}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{date}</span>
                      </div>
                    </td>
                    <td>
                      <span className="ns-badge">{entry.agent}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div className="app-icon" style={{ background: colors.bg, color: colors.color, flexShrink: 0, width: '22px', height: '22px', fontSize: '9px', borderRadius: '5px' }}>
                          {initials}
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 500 }}>{entry.app}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {entry.action}
                      {entry.step && (
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                          ({entry.step})
                        </span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={entry.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
