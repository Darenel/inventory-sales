import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../lib/api';
import { formatCurrency } from '../utils/format';
import { buildQuery, toErrorMessage } from './pageUtils';

type DashboardSummary = {
  revenueToday: string | number;
  revenue7d: string | number;
  revenue30d: string | number;
  salesCountToday: number;
  salesCount7d: number;
  salesCount30d: number;
  lowStockCount: number;
  productCount: number;
  clientCount: number;
};

type TopProduct = {
  productId: string;
  name: string;
  sku: string;
  unitsSold: number;
  revenue: string | number;
};

type SalesSeriesPoint = {
  date: string;
  revenue: string | number;
  salesCount: number;
};

type RevenuePoint = {
  date: string;
  revenue: number;
  salesCount: number;
};

type ProductBar = {
  productId: string;
  name: string;
  sku: string;
  unitsSold: number;
  revenue: number;
};

type RangeDays = 7 | 30 | 90;

const ranges = [7, 30, 90] satisfies RangeDays[];

const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

function toNumber(value: string | number) {
  return Number(value) || 0;
}

function formatChartDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

function RangeToggle({ value, onChange, label }: { value: RangeDays; onChange: (value: RangeDays) => void; label: string }) {
  return (
    <div className="range-toggle" role="group" aria-label={label}>
      {ranges.map((range) => (
        <button
          key={range}
          type="button"
          className={value === range ? 'active' : undefined}
          aria-pressed={value === range}
          onClick={() => onChange(range)}
        >
          {range}d
        </button>
      ))}
    </div>
  );
}

function ChartState({ loading, error, empty }: { loading: boolean; error?: string | null; empty?: string }) {
  if (loading) {
    return <div className="chart-state">Loading...</div>;
  }

  if (error) {
    return <div className="chart-state">{error}</div>;
  }

  return <div className="chart-state">{empty ?? 'No records found.'}</div>;
}

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: RevenuePoint }>; label?: string }) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="chart-tooltip">
      <strong>{label ? formatChartDate(label) : ''}</strong>
      <span>{formatCurrency(point.revenue)}</span>
      <small>{point.salesCount} sales</small>
    </div>
  );
}

function ProductTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ProductBar }> }) {
  if (!active || !payload?.length) {
    return null;
  }

  const product = payload[0].payload;

  return (
    <div className="chart-tooltip">
      <strong>{product.name}</strong>
      <small>{product.sku}</small>
      <span>{formatCurrency(product.revenue)}</span>
      <small>{product.unitsSold} units</small>
    </div>
  );
}

function StatTile({
  label,
  value,
  subline,
  quiet = false,
}: {
  label: string;
  value: string | number;
  subline?: string;
  quiet?: boolean;
}) {
  return (
    <div className={`panel stat-tile${quiet ? ' stat-tile-quiet' : ''}`}>
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
      {subline ? <small>{subline}</small> : null}
    </div>
  );
}

export function DashboardPage() {
  const [revenueDays, setRevenueDays] = useState<RangeDays>(30);
  const [productsDays, setProductsDays] = useState<RangeDays>(30);

  const summary = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api<DashboardSummary>('/dashboard/summary'),
  });

  const salesSeries = useQuery({
    queryKey: ['dashboard-sales-series', revenueDays],
    queryFn: () => api<SalesSeriesPoint[]>(`/dashboard/sales-series${buildQuery({ days: revenueDays })}`),
  });

  const topProducts = useQuery({
    queryKey: ['dashboard-top-products', productsDays],
    queryFn: () => api<TopProduct[]>(`/dashboard/top-products${buildQuery({ days: productsDays, limit: 5 })}`),
  });

  const revenueData =
    salesSeries.data?.map((point) => ({
      date: point.date,
      revenue: toNumber(point.revenue),
      salesCount: point.salesCount,
    })) ?? [];

  const productData =
    topProducts.data?.map((product) => ({
      ...product,
      revenue: toNumber(product.revenue),
    })) ?? [];

  const summaryError = summary.error ? toErrorMessage(summary.error, 'Could not load dashboard summary.') : null;
  const seriesError = salesSeries.error ? toErrorMessage(salesSeries.error, 'Could not load revenue chart.') : null;
  const productsError = topProducts.error ? toErrorMessage(topProducts.error, 'Could not load top products.') : null;

  return (
    <section className="module-page dashboard-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Dashboard</h1>
        </div>
      </header>

      {summaryError ? <div className="error-box">{summaryError}</div> : null}

      <div className="kpi-grid">
        <StatTile
          label="Revenue today"
          value={formatCurrency(summary.data?.revenueToday ?? 0)}
          subline={`${summary.data?.salesCountToday ?? 0} sales`}
        />
        <StatTile
          label="Revenue 7d"
          value={formatCurrency(summary.data?.revenue7d ?? 0)}
          subline={`${summary.data?.salesCount7d ?? 0} sales`}
        />
        <StatTile
          label="Revenue 30d"
          value={formatCurrency(summary.data?.revenue30d ?? 0)}
          subline={`${summary.data?.salesCount30d ?? 0} sales`}
        />
        <Link className="panel stat-tile status-tile" to="/stock">
          <span className="status-icon" aria-hidden="true">
            !
          </span>
          <span className="stat-label">Low stock</span>
          <strong>{summary.data?.lowStockCount ?? 0}</strong>
          <small>Stock alerts</small>
        </Link>
        <StatTile label="Products" value={summary.data?.productCount ?? 0} quiet />
        <StatTile label="Clients" value={summary.data?.clientCount ?? 0} quiet />
      </div>

      <div className="dashboard-charts">
        <section className="panel chart-panel">
          <div className="chart-panel-header">
            <div>
              <p className="eyebrow">Revenue</p>
              <h2>Sales revenue</h2>
            </div>
            <RangeToggle value={revenueDays} onChange={setRevenueDays} label="Revenue range" />
          </div>

          {salesSeries.isLoading || seriesError || revenueData.length === 0 ? (
            <ChartState loading={salesSeries.isLoading} error={seriesError} empty="No revenue records found." />
          ) : (
            <div className="chart-frame">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="var(--line)" strokeWidth={1} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatChartDate}
                    tick={{ fill: 'var(--muted)', fontSize: 12 }}
                    axisLine={{ stroke: 'var(--line)' }}
                    tickLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    width={64}
                    tickFormatter={(value: number) => compactCurrency.format(value)}
                    tick={{ fill: 'var(--muted)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<RevenueTooltip />} cursor={{ stroke: 'var(--muted)', strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="rgba(63, 161, 131, 0.12)"
                    activeDot={{ r: 4, stroke: 'var(--chart-1)', fill: 'var(--panel)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="panel chart-panel">
          <div className="chart-panel-header">
            <div>
              <p className="eyebrow">Products</p>
              <h2>Top products by revenue</h2>
            </div>
            <RangeToggle value={productsDays} onChange={setProductsDays} label="Top products range" />
          </div>

          {topProducts.isLoading || productsError || productData.length === 0 ? (
            <ChartState loading={topProducts.isLoading} error={productsError} empty="No product sales found." />
          ) : (
            <div className="chart-frame">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productData} layout="vertical" barCategoryGap={2} margin={{ top: 8, right: 72, bottom: 0, left: 18 }}>
                  <CartesianGrid stroke="var(--line)" strokeWidth={1} horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(value: number) => compactCurrency.format(value)}
                    tick={{ fill: 'var(--muted)', fontSize: 12 }}
                    axisLine={{ stroke: 'var(--line)' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={118}
                    tick={{ fill: 'var(--muted)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ProductTooltip />} cursor={{ fill: 'rgba(232, 234, 237, 0.04)' }} />
                  <Bar
                    dataKey="revenue"
                    fill="var(--chart-1)"
                    radius={[0, 4, 4, 0]}
                    barSize={12}
                    label={{ position: 'right', fill: 'var(--muted)', formatter: (value: unknown) => formatCurrency(Number(value)) }}
                  >
                    {productData.map((product) => (
                      <Cell key={product.productId} fill="var(--chart-1)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
