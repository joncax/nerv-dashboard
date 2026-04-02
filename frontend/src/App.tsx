import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { fetchApps, fetchPods, restartPod } from './api/client';
import { useAutoRefresh } from './hooks/useAutoRefresh';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { AppCard } from './components/AppCard';
import { PodsTable } from './components/PodsTable';
import { App, Pod } from './types';

const KUBE_NAMESPACES = ['kube-system', 'ingress', 'default'];

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const queryClient = useQueryClient();

  const { data: apps = [] } = useQuery<App[]>('apps', fetchApps, { refetchInterval: false });
  const { data: pods = [] } = useQuery<Pod[]>('pods', fetchPods, { refetchInterval: false });

  const appPods = pods.filter(p => !KUBE_NAMESPACES.includes(p.namespace));
  const kubePods = pods.filter(p => KUBE_NAMESPACES.includes(p.namespace));

  const refresh = useCallback(() => {
    queryClient.invalidateQueries('apps');
    queryClient.invalidateQueries('pods');
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

  return (
    <div className="dash">
      <Header
        onRefresh={refresh}
        refreshInterval={refreshInterval}
        onIntervalChange={setRefreshInterval}
        darkMode={darkMode}
        onToggleTheme={handleToggleTheme}
      />
      <SummaryCards apps={apps} pods={pods} />
      <div className="section-label">Apps</div>
      <div className="apps-grid">
        {apps.map(app => (
          <AppCard key={app.name} app={app} onRestart={handleRestartApp} />
        ))}
      </div>
      <PodsTable
        title="App Pods"
        pods={appPods}
        showRestart={true}
        onRestart={handleRestartPod}
      />
      <PodsTable
        title="Kube-system Pods"
        pods={kubePods}
        showRestart={false}
      />
    </div>
  );
}
