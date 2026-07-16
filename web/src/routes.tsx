import { FormEvent, useMemo, useState } from 'react';
import { Navigate, NavLink, Outlet, RouteObject, useLocation, useNavigate } from 'react-router-dom';
import { ProtectedRoute, useAuth } from './auth';
import { UserRole } from './auth/storage';
import { ApiError } from './lib/api';

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

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <NavLink className="sidebar-brand" to="/dashboard">
          Inventory
        </NavLink>
        <nav className="nav-list" aria-label="Main navigation">
          {visibleModules.map((module) => (
            <NavLink className="nav-link" key={module.path} to={`/${module.path}`}>
              {module.label}
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
          ...modules.map((module) => ({
            path: module.path,
            element: <PlaceholderPage title={module.label} />,
          })),
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
];
