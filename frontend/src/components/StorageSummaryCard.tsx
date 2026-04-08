import { DiskMetrics } from '../types';

interface StorageSummaryCardProps {
  disks: DiskMetrics[];
}

const DISK_SHORT: Record<string, string> = {
  System: '/',
  MyBook500GB: 'MB',
  Passport2TB: 'PP',
};

function getBarColor(percent: number): string {
  if (percent >= 90) return 'var(--color-danger)';
  if (percent >= 75) return 'var(--color-warn)';
  return 'var(--color-ok)';
}

export function StorageSummaryCard({ disks }: StorageSummaryCardProps) {
  const validDisks = disks.filter(d => !d.error);
  const criticalCount = validDisks.filter(d => d.status === 'critical').length;
  const warningCount = validDisks.filter(d => d.status === 'warning').length;

  const subText = () => {
    if (criticalCount > 0) return `${criticalCount} disk critical`;
    if (warningCount > 0) return `${warningCount} disk warning`;
    return 'all disks healthy';
  };

  return (
    <div className="summary-card">
      <div className="s-label">Storage</div>
      <div className="storage-mini-list">
        {disks.map(disk => {
          if (disk.error) {
            return (
              <div key={disk.name} className="storage-mini-row">
                <span className="storage-mini-label">{DISK_SHORT[disk.name] ?? disk.name}</span>
                <div className="storage-mini-bar-wrap">
                  <div className="storage-mini-bar" style={{ width: '0%', background: 'var(--color-muted)' }} />
                </div>
                <span className="storage-mini-pct muted">—</span>
              </div>
            );
          }
          return (
            <div key={disk.name} className="storage-mini-row">
              <span className="storage-mini-label">{DISK_SHORT[disk.name] ?? disk.name}</span>
              <div className="storage-mini-bar-wrap">
                <div
                  className="storage-mini-bar"
                  style={{
                    width: `${disk.percent}%`,
                    background: getBarColor(disk.percent),
                  }}
                />
              </div>
              <span
                className="storage-mini-pct"
                style={{ color: getBarColor(disk.percent) }}
              >
                {disk.percent}%
              </span>
            </div>
          );
        })}
      </div>
      <div className="s-sub">{subText()}</div>
    </div>
  );
}
