import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  AppWindow,
  BarChart3,
  ShoppingBag,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelsTopLeft,
  Settings,
  Shield,
  ChevronDown,
  X,
  Users,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext.jsx';
import { BrandAvatar } from '../shared/components/BrandAvatar.jsx';
import { fullName } from '../shared/utils/userFormat.js';
import { appConfig } from '../shared/config/appConfig.js';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/services', label: 'Services', icon: PanelsTopLeft, afterUserManagement: true },
  { to: '/storefront', label: 'Storefront', icon: PanelsTopLeft, roles: ['ADMIN', 'SUPER_ADMIN'], afterUserManagement: true },
  { to: '/commerce', label: 'Commerce', icon: ShoppingBag, afterUserManagement: true },
  { to: '/applications', label: 'Applications', icon: AppWindow, roles: ['SUPER_ADMIN'], afterUserManagement: true },
  { to: '/audit-logs', label: 'Audit logs', icon: Activity, roles: ['SUPER_ADMIN'] },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/sessions', label: 'Sessions', icon: Shield },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  const { user, hasRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuExpanded, setUserMenuExpanded] = useState(location.pathname.startsWith('/users'));
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const accountRef = useRef(null);
  const visibleItems = navItems.filter((item) => !item.roles || hasRole(...item.roles));
  const accountName = displayAccountName(user);
  const userManagementOpen = location.pathname.startsWith('/users');
  const primaryRole = hasRole('SUPER_ADMIN') ? 'Super admin' : user?.roles?.[0] || 'Account';

  useEffect(() => {
    const close = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const onLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="shell">
      <aside className={`sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <strong>{appConfig.companyName}</strong>
            <span>{appConfig.tagline}</span>
          </div>
          <button
            className="mobile-menu-toggle"
            type="button"
            onClick={() => setMobileNavOpen((value) => !value)}
            aria-expanded={mobileNavOpen}
            aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}
          >
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav>
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.to}>
                <NavLink to={item.to} end={item.to === '/'}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
                {item.to === '/' && hasRole('SUPER_ADMIN') ? (
                  <div className={`nav-group ${userMenuExpanded ? 'open' : ''} ${userManagementOpen ? 'active-parent' : ''}`}>
                    <button className="nav-group-trigger" type="button" onClick={() => setUserMenuExpanded((value) => !value)} aria-expanded={userMenuExpanded}>
                      <Users size={18} />
                      <span>User management</span>
                      <ChevronDown size={15} />
                    </button>
                    <div className="nav-submenu">
                      <NavLink to="/users" end>View users</NavLink>
                      <NavLink to="/users/new">Create user</NavLink>
                      <NavLink to="/users/roles">Roles</NavLink>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
        <button className="logout" onClick={onLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>
      <main className="content">
        <header className="topbar">
          <div>
            <span className="eyebrow">{appConfig.tagline}</span>
            <h1>Operations dashboard</h1>
          </div>
          <div className="account-wrap" ref={accountRef}>
            <button className="account-menu" type="button" onClick={() => setAccountOpen((value) => !value)} aria-expanded={accountOpen}>
              <BrandAvatar user={user} size="small" />
              <div>
                <span>{primaryRole}</span>
                <strong>{accountName}</strong>
              </div>
              <ChevronDown size={16} />
            </button>
            {accountOpen ? (
              <section className="account-popover">
                <div className="account-popover-head">
                  <div>
                    <h3>Hi, {accountName}</h3>
                    <span>{user?.email}</span>
                  </div>
                  <strong>{primaryRole}</strong>
                </div>
                <div className="account-popover-links">
                  <button type="button" onClick={() => { setAccountOpen(false); navigate('/profile'); }}>Account</button>
                  <button type="button" onClick={() => { setAccountOpen(false); navigate('/sessions'); }}>Active sessions</button>
                  <button type="button" onClick={() => { setAccountOpen(false); navigate('/settings'); }}>Settings</button>
                </div>
                <button type="button" className="account-signout" onClick={onLogout}>Sign out</button>
              </section>
            ) : null}
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

function displayAccountName(user) {
  const name = fullName(user);
  if (name && !name.includes('@')) return name.split(' ')[0] || name;
  return user?.username || 'Admin';
}
