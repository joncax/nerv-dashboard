import { App, Pod, SystemMetrics, DiskMetrics } from '../types';
import { StorageSummaryCard } from './StorageSummaryCard';

interface SummaryCardsProps {
  apps: App[];
  pods: Pod[];
  system?: SystemMetrics;
  disks: DiskMetrics[];
}

export function SummaryCards({ apps, pods, system, disks }: SummaryCardsProps) {
  const appsOnline = apps.filter(a => a.healthy).length;
  const podsRunning = pods.filter(p => p.status === 'Running').length;

  return (
    <div className="summary-grid">
      <div className="summary-card">
        <div className="s-label">Pods</div>
        <div className="s-value">
          {podsRunning}
          <span className="s-total"> / {pods.length}</span>
        </div>
        <div className="s-sub">
          {podsRunning === pods.length ? 'all running' : `${pods.length - podsRunning} with issues`}
        </div>
      </div>
      <div className="summary-card">
        <div className="s-label">Apps</div>
        <div className="s-value">
          {appsOnline}
          <span className="s-total"> / {apps.length}</span>
        </div>
        <div className="s-sub">
          {appsOnline === apps.length ? 'all online' : `${apps.length - appsOnline} offline`}
        </div>
      </div>
      <div className="summary-card">
        <div className="s-label">RAM</div>
        <div className="s-value">
          {system ? `${system.ram.percent}%` : '—'}
        </div>
        <div className="s-sub">
          {system ? `${system.ram.used_gb} / ${system.ram.total_gb} GB` : 'loading...'}
        </div>
      </div>
      <StorageSummaryCard disks={disks} />
    </div>
  );
}
