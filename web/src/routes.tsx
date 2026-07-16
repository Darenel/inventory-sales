import { FormEvent, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate, NavLink, Outlet, RouteObject, useLocation, useNavigate } from 'react-router-dom';
import { ProtectedRoute, useAuth } from './auth';
import { UserRole } from './auth/storage';
import { ApiError, api } from './lib/api';
import { StockAlertsResponse } from './lib/types';
import { CategoriesPage } from './pages/CategoriesPage';
import { ClientsPage } from './pages/ClientsPage';
import { NewSalePage } from './pages/NewSalePage';
import { ProductsPage } from './pages/ProductsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SalesPage } from './pages/SalesPage';
import { StockPage } from './pages/StockPage';
import { SuppliersPage } from './pages/SuppliersPage';

type Module = {
  path: string;
  label: string;
  roles: UserRole[];
};

const allRoles: UserRole[] = ['admin', 'vendedor', 'almacen'];

export const modules: Module[] = [
  { path: 'dashboard', label: 'Dashboard', roles: ['admin'] },
  { path: 'products', label: 'Products', roles: allRoles },
  { path: 'categories', label: 'Categories', roles: allRoles },
  { path: 'clients', label: 'Clients', roles: ['admin', 'vendedor'] },
  { path: 'suppliers', label: 'Suppliers', roles: ['admin', 'vendedor', 'almacen'] },
  { path: 'sales', label: 'Sales', roles: allRoles },
  { path: 'stock', label: 'Stock', roles: ['admin', 'almacen'] },
  { path: 'reports', label: 'Reports', roles: ['admin'] },
];

function LoginPage() {
  const { login, token } = useAuth();
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
      setError(caught instanceof ApiError ? caught.message : 'Login failed. Check the credentials and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="panel login-panel" aria-labelledby="login-title">
        <h1 className="wordmark" id="login-title">
          Inventory
        </h1>
        <p className="login-copy">Sign in to manage inventory, sales, and stock operations.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
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
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="hint-box">
          <p>Demo credentials</p>
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
          Inventory
        </NavLink>
        <nav className="nav-list" aria-label="Main navigation">
          {visibleModules.map((module) => (
            <NavLink className="nav-link" key={module.path} to={`/${module.path}`}>
              <span>{module.label}</span>
              {module.path === 'stock' && (stockAlerts.data?.total ?? 0) > 0 ? (
                <span className="nav-badge">{stockAlerts.data?.total}</span>
              ) : null}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <span className="user-name">{user?.name}</span>
          {role ? <span className="role-badge">{role}</span> : null}
          <button className="ghost" type="button" onClick={logout}>
            Logout
          </button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="panel placeholder-page">
      <p className="placeholder-kicker">Phase 6 module</p>
      <h1>{title}</h1>
    </section>
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
          { path: 'dashboard', element: <PlaceholderPage title="Dashboard" /> },
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
