import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext.jsx';
import { AdminLayout } from '../layouts/AdminLayout.jsx';
import { LoginPage } from '../features/auth/LoginPage.jsx';
import { DashboardPage } from '../features/dashboard/DashboardPage.jsx';
import { ServiceModulesPage } from '../features/services/ServiceModulesPage.jsx';
import { CommercePage } from '../features/commerce/CommercePage.jsx';
import { UsersPage } from '../features/users/UsersPage.jsx';
import { UserDetailsPage } from '../features/users/UserDetailsPage.jsx';
import { CreateUserPage } from '../features/users/CreateUserPage.jsx';
import { UserManagementShell } from '../features/users/UserManagementShell.jsx';
import { RolesPage } from '../features/users/RolesPage.jsx';
import { ApplicationsPage } from '../features/applications/ApplicationsPage.jsx';
import { AuditLogsPage } from '../features/auditLogs/AuditLogsPage.jsx';
import { ProfilePage } from '../features/profile/ProfilePage.jsx';
import { SessionsPage } from '../features/sessions/SessionsPage.jsx';
import { SettingsPage } from '../features/settings/SettingsPage.jsx';
import { LoadingState } from '../shared/components/Ui.jsx';

function Protected({ children }) {
  const { booting, isAuthenticated } = useAuth();
  if (booting) return <LoadingState label="Starting admin console" />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function SuperAdminOnly({ children }) {
  const { hasRole } = useAuth();
  return hasRole('SUPER_ADMIN') ? children : <Navigate to="/" replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <Protected>
            <AdminLayout />
          </Protected>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="services" element={<ServiceModulesPage />} />
        <Route path="commerce" element={<CommercePage />} />
        <Route path="users" element={<SuperAdminOnly><UserManagementShell /></SuperAdminOnly>}>
          <Route index element={<UsersPage />} />
          <Route path="new" element={<CreateUserPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path=":publicId" element={<UserDetailsPage />} />
        </Route>
        <Route path="applications" element={<SuperAdminOnly><ApplicationsPage /></SuperAdminOnly>} />
        <Route path="audit-logs" element={<SuperAdminOnly><AuditLogsPage /></SuperAdminOnly>} />
        <Route path="reports" element={<SettingsPage title="Reports" />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="settings" element={<SettingsPage title="Settings" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
