import { Outlet } from 'react-router-dom';

export function UserManagementShell() {
  return (
    <div className="module-shell clean-module-shell">
      <Outlet />
    </div>
  );
}
