import { Pod } from '../types';

interface PodsTableProps {
  title: string;
  pods: Pod[];
  showRestart?: boolean;
  onRestart?: (pod: Pod) => void;
}

export function PodsTable({ title, pods, showRestart = false, onRestart }: PodsTableProps) {
  const shortName = (name: string) => name.replace(/-[a-z0-9]{5,10}-[a-z0-9]{5}$/, '');

  return (
    <div className="table-card">
      <div className="table-title">{title}</div>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Namespace</th>
            <th>Status</th>
            <th>Uptime</th>
            <th>Restarts</th>
            {showRestart && <th></th>}
          </tr>
        </thead>
        <tbody>
          {pods.map(pod => (
            <tr key={pod.name}>
              <td>{shortName(pod.name)}</td>
              <td><span className="ns-badge">{pod.namespace}</span></td>
              <td>
                <span className={pod.status === 'Running' ? 'st-running' : 'st-warn'}>
                  {pod.status}
                </span>
              </td>
              <td className="uptime">{pod.uptime ?? '—'}</td>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
