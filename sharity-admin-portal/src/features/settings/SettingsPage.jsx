import { Card } from '../../shared/components/Ui.jsx';

export function SettingsPage({ title = 'Settings' }) {
  return (
    <Card>
      <div className="section-head">
        <h2>{title}</h2>
        <span>Placeholder</span>
      </div>
      <p>This area is reserved for future reporting, configuration, and microservice controls.</p>
    </Card>
  );
}
