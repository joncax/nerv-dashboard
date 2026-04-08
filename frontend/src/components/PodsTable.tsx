import { Pod, PodMetricsMap } from '../types';

interface PodsTableProps {
  title: string;
  pods: Pod[];
  metrics?: PodMetricsMap;
  showRestart?: boolean;
  onRestart?: (pod: Pod) => void;
}

const MAX_MEM_MI = 700;

function MiniBar({ percent, color }: { percent: number; color: string }) {
  const clamped = Math.min(percent, 100);
  return (
    <div className="mini-bar-wrap">
      <div className="mini-bar" style={{ width: `${clamped}%`, background: color }} />
    </div>
  );
}

function getMemColor(mem_mi: number): string {
  const pct = (mem_mi / MAX_MEM_MI) * 100;
  if (pct >= 90) return 'var(--color-danger)';
  if (pct >= 60) return 'var(--color-warn)';
  return 'var(--color-ok)';
}

function getCpuColor(cpu_m: number): string {
  if (cpu_m >= 500) return 'var(--color-danger)';
  if (cpu_m >= 200) return 'var(--color-warn)';
  return 'var(--color-ok)';
}

export function PodsTable({ title, pods, metrics, showRestart = false, onRestart }: PodsTableProps) {
  const shortName = (name: string) => name.replace(/-[a-z0-9]{5,10}-[a-z0-9]{5}$/, '');

  return (
    <div className="table-card">
      <div className="table-title">{title}</div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Namespace</th>
            <th>Status</th>
            <th>Uptime</th>
            {metrics && <th>CPU</th>}
            {metrics && <th>RAM</th>}
            <th>Restarts</th>
            {showRestart && <th></th>}
          </tr>
        </thead>
        <tbody>
          {pods.map(pod => {
            const key = `${pod.namespace}/${pod.name}`;
            const m = metrics?.[key];
            return (
              <tr key={pod.name}>
                <td>{shortName(pod.name)}</td>
                <td><span className="ns-badge">{pod.namespace}</span></td>
                <td>
                  <span className={pod.status === 'Running' ? 'st-running' : 'st-warn'}>
                    {pod.status}
                  </span>
                </td>
                <td className="uptime">{pod.uptime ?? '—'}</td>
                {metrics && (
                  <td>
                    {m ? (
                      <div className="metric-cell">
                        <MiniBar
                          percent={(m.cpu_m / 1000) * 100}
                          color={getCpuColor(m.cpu_m)}
                        />
                        <span className="metric-val">{m.cpu_m}m</span>
                      </div>
                    ) : <span className="muted">—</span>}
                  </td>
                )}
                {metrics && (
                  <td>
                    {m ? (
                      <div className="metric-cell">
                        <MiniBar
                          percent={(m.mem_mi / MAX_MEM_MI) * 100}
                          color={getMemColor(m.mem_mi)}
                        />
                        <span className="metric-val">{m.mem_mi}Mi</span>
                      </div>
                    ) : <span className="muted">—</span>}
                  </td>
                )}
                <td className={pod.restarts > 5 ? 'restart-high' : 'restart-num'}>
                  {pod.restarts}
                </td>
                {showRestart && (
                  <td>
                    <button className="icon-btn" onClick={() => onRestart?.(pod)} title="restart">
                      ↺
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
