

interface HeaderProps {
  onRefresh: () => void;
  refreshInterval: number;
  onIntervalChange: (val: number) => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

export function Header({ onRefresh, refreshInterval, onIntervalChange, darkMode, onToggleTheme }: HeaderProps) {
  return (
    <div className="header">
      <div className="header-left">
        <div className="logo">N</div>
        <div>
          <div className="h-title">nerv-server</div>
          <div className="h-sub">192.168.1.50 · nerv-server-k8s-01.local</div>
        </div>
      </div>
      <div className="header-right">
        <select
          className="refresh-select"
          value={refreshInterval}
          onChange={e => onIntervalChange(Number(e.target.value))}
        >
          <option value={30}>30s</option>
          <option value={45}>45s</option>
          <option value={60}>60s</option>
        </select>
        <button className="icon-btn" title="atualizar agora" onClick={onRefresh}>↻</button>
        <button className="icon-btn" title="tema" onClick={onToggleTheme}>
          {darkMode ? '☀' : '☾'}
        </button>
      </div>
    </div>
  );
}
