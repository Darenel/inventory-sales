import { FormEvent, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate, NavLink, Outlet, RouteObject, useLocation, useNavigate } from 'react-router-dom';
import { ProtectedRoute, useAuth } from './auth';
import { UserRole } from './auth/storage';
import { LangToggle } from './i18n/LangToggle';
import { TranslationKey } from './i18n/translations';
import { useI18n } from './i18n/I18nContext';
import { ApiError, api } from './lib/api';
import { StockAlertsResponse } from './lib/types';
import { CategoriesPage } from './pages/CategoriesPage';
import { ClientsPage } from './pages/ClientsPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewSalePage } from './pages/NewSalePage';
import { ProductsPage } from './pages/ProductsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SalesPage } from './pages/SalesPage';
import { StockPage } from './pages/StockPage';
import { SuppliersPage } from './pages/SuppliersPage';

type Module = {
  path: string;
  labelKey: TranslationKey;
  roles: UserRole[];
};

const allRoles: UserRole[] = ['admin', 'vendedor', 'almacen'];
const isDemoMode = import.meta.env.VITE_MODE === 'demo';

export const modules: Module[] = [
  { path: 'dashboard', labelKey: 'module.dashboard', roles: ['admin'] },
  { path: 'products', labelKey: 'module.products', roles: allRoles },
  { path: 'categories', labelKey: 'module.categories', roles: allRoles },
  { path: 'clients', labelKey: 'module.clients', roles: ['admin', 'vendedor'] },
  { path: 'suppliers', labelKey: 'module.suppliers', roles: ['admin', 'vendedor', 'almacen'] },
  { path: 'sales', labelKey: 'module.sales', roles: allRoles },
  { path: 'stock', labelKey: 'module.stock', roles: ['admin', 'almacen'] },
  { path: 'reports', labelKey: 'module.reports', roles: ['admin'] },
];

function LoginPage() {
  const { login, token } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('admin@inventory.local');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';

  if (token) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('auth.loginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-lang">
        <LangToggle />
      </div>
      <section className="panel login-panel" aria-labelledby="login-title">
        <h1 className="wordmark" id="login-title">
          {t('app.name')}
        </h1>
        <p className="login-copy">{t('auth.loginCopy')}</p>
        {isDemoMode ? <p className="demo-note">{t('auth.demoMode')}</p> : null}

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            {t('auth.email')}
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            {t('auth.password')}
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <div className="error-box">{error}</div> : null}
          <button className="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </form>

        <div className="hint-box">
          <p>{t('auth.demoCredentials')}</p>
          <ul className="hint-list">
            <li>
              <code>admin@inventory.local</code> / <code>demo1234</code>
            </li>
            <li>
              <code>vendedor@inventory.local</code> / <code>demo1234</code>
            </li>
            <li>
              <code>almacen@inventory.local</code> / <code>demo1234</code>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}

function AppLayout() {
  const { user, role, logout } = useAuth();
  const { t } = useI18n();
  const visibleModules = useMemo(
    () => modules.filter((module) => role && module.roles.includes(role)),
    [role],
  );
  const stockAlerts = useQuery({
    queryKey: ['stock-alerts'],
    queryFn: () => api<StockAlertsResponse>('/stock/alerts'),
    enabled: role === 'admin' || role === 'almacen',
    refetchInterval: 30000,
  });

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <NavLink className="sidebar-brand" to="/dashboard">
          {t('app.name')}
        </NavLink>
        <nav className="nav-list" aria-label={t('nav.main')}>
          {visibleModules.map((module) => (
            <NavLink className="nav-link" key={module.path} to={`/${module.path}`}>
              <span>{t(module.labelKey)}</span>
              {module.path === 'stock' && (stockAlerts.data?.total ?? 0) > 0 ? (
                <span className="nav-badge">{stockAlerts.data?.total}</span>
              ) : null}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <LangToggle />
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <span className="user-name">{user?.name}</span>
          {role ? <span className="role-badge">{role}</span> : null}
          <button className="ghost" type="button" onClick={logout}>
            {t('nav.logout')}
          </button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'products', element: <ProductsPage /> },
          { path: 'categories', element: <CategoriesPage /> },
          { path: 'clients', element: <ClientsPage /> },
          { path: 'suppliers', element: <SuppliersPage /> },
          { path: 'sales', element: <SalesPage /> },
          { path: 'sales/new', element: <NewSalePage /> },
          { path: 'stock', element: <StockPage /> },
          { path: 'reports', element: <ReportsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
];
