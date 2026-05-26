import { useEffect, useState } from 'react';
import { Activity, AppWindow, ExternalLink, Gauge, ShoppingBag, Users, Wallet } from 'lucide-react';
import { Button, Card } from '../../shared/components/Ui.jsx';
import { adminService } from '../../shared/api/adminService.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { launchServiceModule } from '../../shared/utils/serviceLauncher.js';

const modules = ['Marketplace', 'Grocery', 'Meat shop', 'Pharmacy', 'Logistics', 'Automotive', 'Wallet'];
const teslaUrl = import.meta.env.VITE_TESLA_APP_URL || '/tesla/';

export function DashboardPage() {
  const { applications, user } = useAuth();
  const [stats, setStats] = useState({ users: '-', apps: '-', logs: '-', sessions: '-' });
  const showTesla = applications.includes('*') || applications.includes('TESLA');

  useEffect(() => {
    adminService.dashboardSummary()
      .then((summary) => setStats({
        users: summary.totalUsers ?? '-',
        apps: summary.applications ?? '-',
        logs: summary.auditEvents ?? '-',
        sessions: summary.activeSessions ?? '-',
      }))
      .catch(() => {});
  }, []);

  return (
    <div className="page-grid">
      <Card className="metric"><Users /><span>Users</span><strong>{stats.users}</strong></Card>
      <Card className="metric"><AppWindow /><span>Applications</span><strong>{stats.apps}</strong></Card>
      <Card className="metric"><Activity /><span>Audit logs</span><strong>{stats.logs}</strong></Card>
      <Card className="metric"><Wallet /><span>Active sessions</span><strong>{stats.sessions}</strong></Card>
      <section className="panel wide">
        <div className="section-head">
          <h2>Service modules</h2>
          <span>Expandable app catalog</span>
        </div>
        <div className="module-grid">
          {modules.map((module) => (
            <div className="module-tile" key={module}>
              <ShoppingBag size={20} />
              <strong>{module}</strong>
            </div>
          ))}
          {showTesla ? (
            <div className="module-tile service-module-tile">
              <Gauge size={20} />
              <strong>Tesla Dashboard</strong>
              <span>Vehicle controls and live dashboard</span>
              <Button type="button" variant="ghost" onClick={() => launchServiceModule(teslaUrl, user)}>
                <ExternalLink size={16} />
                Open
              </Button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
