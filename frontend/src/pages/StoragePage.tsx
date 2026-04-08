import { useState } from 'react';
import { useQuery } from 'react-query';
import { fetchDisks, fetchFolders } from '../api/client';
import { DiskMetrics, FolderEntry } from '../types';

const DISK_KEYS: Record<string, string> = {
  System: 'system',
  MyBook500GB: 'mybook',
  Passport2TB: 'passport',
};

function getBarColor(percent: number): string {
  if (percent >= 90) return 'var(--color-danger)';
  if (percent >= 75) return 'var(--color-warn)';
  return 'var(--color-ok)';
}

function getStatusLabel(status: string): string {
  if (status === 'critical') return 'critical';
  if (status === 'warning') return 'warning';
  return 'healthy';
}

function getStatusClass(status: string): string {
  if (status === 'critical') return 'badge-critical';
  if (status === 'warning') return 'badge-warning';
  return 'badge-healthy';
}

function formatSize(gb: number): string {
  if (gb >= 1000) return `${(gb / 1024).toFixed(1)} TB`;
  return `${gb} GB`;
}

interface DiskCardProps {
  disk: DiskMetrics;
}

function DiskCard({ disk }: DiskCardProps) {
  if (disk.error) {
    return (
      <div className="disk-card disk-card-error">
        <div className="disk-card-top">
          <div>
            <div className="disk-title">{disk.name}</div>
            <div className="disk-mount">{disk.mount}</div>
          </div>
          <span className="badge badge-critical">unavailable</span>
        </div>
        <div className="disk-error-msg">{disk.error}</div>
      </div>
    );
  }

  return (
    <div className={`disk-card disk-card-${disk.status}`}>
      <div className="disk-card-top">
        <div>
          <div className="disk-title">{disk.name}</div>
          <div className="disk-mount">{disk.mount}</div>
        </div>
        <span className={`badge ${getStatusClass(disk.status)}`}>
          {getStatusLabel(disk.status)}
        </span>
      </div>
      <div className="disk-bar-wrap">
        <div
          className="disk-bar"
          style={{ width: `${disk.percent}%`, background: getBarColor(disk.percent) }}
        />
      </div>
      <div className="disk-stats">
        <div className="dstat">
          <div className="dstat-label">Total</div>
          <div className="dstat-value">{formatSize(disk.total_gb)}</div>
        </div>
        <div className="dstat">
          <div className="dstat-label">Used</div>
          <div className="dstat-value">{formatSize(disk.used_gb)}</div>
        </div>
        <div className="dstat">
          <div className="dstat-label">Available</div>
          <div className="dstat-value" style={{ color: getBarColor(disk.percent) }}>
            {formatSize(disk.free_gb)}
          </div>
        </div>
        <div className="dstat">
          <div className="dstat-label">Usage</div>
          <div className="dstat-value" style={{ color: getBarColor(disk.percent) }}>
            {disk.percent}%
          </div>
        </div>
      </div>
      {disk.inodes && (
        <div className="inode-row">
          <span className="inode-label">Inodes</span>
          <div className="inode-bar-wrap">
            <div
              className="inode-bar"
              style={{
                width: `${disk.inodes.percent}%`,
                background: getBarColor(disk.inodes.percent),
              }}
            />
          </div>
          <span className="inode-val" style={{ color: getBarColor(disk.inodes.percent) }}>
            {disk.inodes.percent}% used
          </span>
        </div>
      )}
    </div>
  );
}

interface FoldersCardProps {
  disks: DiskMetrics[];
}

function FoldersCard({ disks }: FoldersCardProps) {
  const validDisks = disks.filter(d => !d.error);
  const [activeDisk, setActiveDisk] = useState<string>(
    validDisks.find(d => d.status === 'critical')?.name ??
    validDisks.find(d => d.status === 'warning')?.name ??
    validDisks[0]?.name ?? ''
  );
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  const diskKey = DISK_KEYS[activeDisk] ?? activeDisk.toLowerCase();

  const { data, isFetching, refetch } = useQuery(
    ['folders', diskKey],
    () => fetchFolders(diskKey),
    {
      enabled: false,
      keepPreviousData: true,
    }
  );

  const handleTabClick = (name: string) => {
    setActiveDisk(name);
    if (!loaded[name]) {
      setLoaded(prev => ({ ...prev, [name]: true }));
    }
  };

  const handleLoad = () => {
    setLoaded(prev => ({ ...prev, [activeDisk]: true }));
    refetch();
  };

  const folders: FolderEntry[] = data?.folders ?? [];
  const maxBytes = folders[0]?.size_bytes ?? 1;
  const isLoaded = loaded[activeDisk];

  return (
    <div className="table-card">
      <div className="folders-header">
        <div className="folders-tabs">
          {validDisks.map(disk => (
            <button
              key={disk.name}
              className={`folder-tab ${activeDisk === disk.name ? 'folder-tab-active' : ''} folder-tab-${disk.status}`}
              onClick={() => handleTabClick(disk.name)}
            >
              {disk.name}
              {disk.status === 'critical' && ' ⚠'}
            </button>
          ))}
        </div>
        <div className="folders-actions">
          <span className="folders-note">on-demand · not auto-refreshed</span>
          <button className="icon-btn" onClick={handleLoad} disabled={isFetching}>
            {isFetching ? '...' : '↺'}
          </button>
        </div>
      </div>
      {!isLoaded ? (
        <div className="folders-empty">
          Click ↺ to load folder sizes for {activeDisk}
        </div>
      ) : isFetching ? (
        <div className="folders-empty">Loading...</div>
      ) : folders.length === 0 ? (
        <div className="folders-empty">No folders found.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Folder</th>
              <th>Size</th>
              <th>Share</th>
            </tr>
          </thead>
          <tbody>
            {folders.map(f => (
              <tr key={f.path}>
                <td className="folder-path">{f.path}</td>
                <td>{f.size_human}</td>
                <td>
                  <div className="metric-cell">
                    <div className="mini-bar-wrap">
                      <div
                        className="mini-bar"
                        style={{
                          width: `${Math.round((f.size_bytes / maxBytes) * 100)}%`,
                          background: 'var(--color-accent)',
                        }}
                      />
                    </div>
                    <span className="metric-val muted">
                      {Math.round((f.size_bytes / maxBytes) * 100)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

interface StoragePageProps {
  disks: DiskMetrics[];
}

export function StoragePage({ disks }: StoragePageProps) {
  const validDisks = disks.filter(d => !d.error);
  const totalGb = validDisks.reduce((s, d) => s + d.total_gb, 0);
  const usedGb = validDisks.reduce((s, d) => s + d.used_gb, 0);
  const freeGb = validDisks.reduce((s, d) => s + d.free_gb, 0);
  const criticalCount = validDisks.filter(d => d.status === 'critical').length;
  const warningCount = validDisks.filter(d => d.status === 'warning').length;

  function formatSize(gb: number): string {
    if (gb >= 1000) return `${(gb / 1024).toFixed(1)} TB`;
    return `${Math.round(gb)} GB`;
  }

  return (
    <div>
      <div className="summary-grid" style={{ marginBottom: '20px' }}>
        <div className="summary-card">
          <div className="s-label">Total capacity</div>
          <div className="s-value">{formatSize(totalGb)}</div>
          <div className="s-sub">{validDisks.length} mounted disks</div>
        </div>
        <div className="summary-card">
          <div className="s-label">Used</div>
          <div className="s-value" style={{ color: 'var(--color-warn)' }}>{formatSize(usedGb)}</div>
          <div className="s-sub">{Math.round((usedGb / totalGb) * 100)}% of total</div>
        </div>
        <div className="summary-card">
          <div className="s-label">Available</div>
          <div className="s-value" style={{ color: criticalCount > 0 ? 'var(--color-danger)' : 'var(--color-warn)' }}>
            {formatSize(freeGb)}
          </div>
          <div className="s-sub">
            {criticalCount > 0
              ? `${criticalCount} disk critical`
              : warningCount > 0
              ? `${warningCount} disk warning`
              : 'all disks healthy'}
          </div>
        </div>
      </div>

      <div className="disk-cards">
        {disks.map(disk => (
          <DiskCard key={disk.name} disk={disk} />
        ))}
      </div>

      <div className="table-title" style={{ marginBottom: '8px' }}>Top folders</div>
      {disks.length > 0 && <FoldersCard disks={disks} />}
    </div>
  );
}
