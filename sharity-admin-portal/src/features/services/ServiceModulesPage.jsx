import { ExternalLink, Gauge } from 'lucide-react';
import { Button, EmptyState } from '../../shared/components/Ui.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { launchServiceModule } from '../../shared/utils/serviceLauncher.js';

const serviceModules = [
  {
    code: 'TESLA',
    name: 'Tesla Dashboard',
    description: 'Vehicle controls, charging status, profile, and Tesla activity dashboard.',
    url: import.meta.env.VITE_TESLA_APP_URL || '/tesla/',
    icon: Gauge,
  },
];

export function ServiceModulesPage() {
  const { applications, user } = useAuth();
  const canAccessAll = applications.includes('*');
  const visibleModules = serviceModules.filter((module) => canAccessAll || applications.includes(module.code));

  return (
    <div className="page-stack">
      <section className="panel surface-panel">
        <div className="section-head">
          <div>
            <h2>Service modules</h2>
            <span>Open connected Sharity business applications.</span>
          </div>
        </div>
        {visibleModules.length === 0 ? (
          <EmptyState title="No modules assigned" text="" />
        ) : (
          <div className="service-grid">
            {visibleModules.map((module) => {
              const Icon = module.icon;
              return (
                <article className="service-card" key={module.code}>
                  <div className="service-icon"><Icon size={22} /></div>
                  <div>
                    <span>{module.code}</span>
                    <h3>{module.name}</h3>
                    <p>{module.description}</p>
                  </div>
                  <Button type="button" onClick={() => launchServiceModule(module.url, user)}>
                    <ExternalLink size={17} />
                    Open
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
