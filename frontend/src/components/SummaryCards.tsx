import { App, Pod } from '../types';

interface SummaryCardsProps {
  apps: App[];
  pods: Pod[];
}

export function SummaryCards({ apps, pods }: SummaryCardsProps) {
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
          {podsRunning === pods.length ? 'todos running' : `${pods.length - podsRunning} com problemas`}
        </div>
      </div>
      <div className="summary-card">
        <div className="s-label">Apps</div>
        <div className="s-value">
          {appsOnline}
          <span className="s-total"> / {apps.length}</span>
        </div>
        <div className="s-sub">
          {appsOnline === apps.length ? 'todas online' : `${apps.length - appsOnline} offline`}
        </div>
      </div>
      <div className="summary-card">
        <div className="s-label">RAM</div>
        <div className="s-value">—</div>
        <div className="s-sub">via netdata (em breve)</div>
      </div>
      <div className="summary-card">
        <div className="s-label">Disco</div>
        <div className="s-value">—</div>
        <div className="s-sub">via netdata (em breve)</div>
      </div>
    </div>
  );
}
