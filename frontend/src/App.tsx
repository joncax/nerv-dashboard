import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { fetchApps, fetchPods, restartPod, fetchSystem, fetchDisks, fetchPodMetrics } from './api/client';
import { useAutoRefresh } from './hooks/useAutoRefresh';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { AppCard } from './components/AppCard';
import { PodsTable } from './components/PodsTable';
import { StoragePage } from './pages/StoragePage';
import { Footer } from './components/Footer';
import { App, Pod, SystemMetrics, DiskMetrics, PodMetricsMap } from './types';

const KUBE_NAMESPACES = ['kube-system', 'ingress', 'default'];
type Tab = 'overview' | 'pods' | 'storage' | 'apps';

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const queryClient = useQueryClient();

  const { data: apps = [] } = useQuery<App[]>('apps', fetchApps, { refetchInterval: false });
  const { data: pods = [] } = useQuery<Pod[]>('pods', fetchPods, { refetchInterval: false });
  const { data: system } = useQuery<SystemMetrics>('system', fetchSystem, { refetchInterval: false });
  const { data: disks = [] } = useQuery<DiskMetrics[]>('disks', fetchDisks, { refetchInterval: false });
  const { data: podMetrics } = useQuery<PodMetricsMap>('podMetrics', fetchPodMetrics, { refetchInterval: false });

  const appPods = pods.filter(p => !KUBE_NAMESPACES.includes(p.namespace));
  const kubePods = pods.filter(p => KUBE_NAMESPACES.includes(p.namespace));

  const refresh = useCallback(() => {
    queryClient.invalidateQueries('apps');
    queryClient.invalidateQueries('pods');
    queryClient.invalidateQueries('system');
    queryClient.invalidateQueries('disks');
    queryClient.invalidateQueries('podMetrics');
  }, [queryClient]);

  useAutoRefresh(refresh, refreshInterval);

  const handleToggleTheme = () => {
    setDarkMode(prev => {
      document.documentElement.classList.toggle('light', prev);
      return !prev;
    });
  };

  const handleRestartApp = async (app: App) => {
    const pod = appPods.find(p => p.namespace === app.name.toLowerCase());
    if (!pod) return;
    await restartPod(pod.namespace, pod.name);
    setTimeout(refresh, 2000);
  };

  const handleRestartPod = async (pod: Pod) => {
    await restartPod(pod.namespace, pod.name);
    setTimeout(refresh, 2000);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'pods', label: 'Pods' },
    { key: 'storage', label: 'Storage' },
    { key: 'apps', label: 'Apps' },
  ];

  return (
    <div className="dash">
      <Header
        onRefresh={refresh}
        refreshInterval={refreshInterval}
        onIntervalChange={setRefreshInterval}
        darkMode={darkMode}
        onToggleTheme={handleToggleTheme}
      />
      <SummaryCards apps={apps} pods={pods} system={system} disks={disks} />

      <div className="nav-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`nav-tab ${activeTab === tab.key ? 'nav-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="section-label">Apps</div>
          <div className="apps-grid">
            {apps.map(app => (
              <AppCard key={app.name} app={app} onRestart={handleRestartApp} />
            ))}
          </div>
          <PodsTable
            title="App Pods"
            pods={appPods}
            metrics={podMetrics}
            showRestart={true}
            onRestart={handleRestartPod}
          />
          <PodsTable
            title="Kube-system Pods"
            pods={kubePods}
            showRestart={false}
          />
        </>
      )}

      {activeTab === 'pods' && (
        <>
          <PodsTable
            title="App Pods"
            pods={appPods}
            metrics={podMetrics}
            showRestart={true}
            onRestart={handleRestartPod}
          />
          <PodsTable
            title="Kube-system Pods"
            pods={kubePods}
            showRestart={false}
          />
        </>
      )}

      {activeTab === 'storage' && (
        <StoragePage disks={disks} />
      )}

      {activeTab === 'apps' && (
        <>
          <div className="section-label">Apps</div>
          <div className="apps-grid">
            {apps.map(app => (
              <AppCard key={app.name} app={app} onRestart={handleRestartApp} />
            ))}
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}