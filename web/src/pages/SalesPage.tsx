import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueries, useQuery } from '@tanstack/react-query';
import { RoleGate, useAuth } from '../auth';
import { DataTable, DataTableColumn } from '../components/DataTable';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { useI18n } from '../i18n/I18nContext';
import { api } from '../lib/api';
import { Client, ListResponse, Product, Sale, SaleSummary, SortDir } from '../lib/types';
import { formatCurrency, formatDate } from '../utils/format';
import { buildQuery, pageLimit } from './pageUtils';

function asDayEnd(value: string) {
  return value ? new Date(`${value}T23:59:59.999`).toISOString() : undefined;
}

function asDayStart(value: string) {
  return value ? new Date(`${value}T00:00:00.000`).toISOString() : undefined;
}

export function SalesPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  const sales = useQuery({
    queryKey: ['sales', { page, from, to, sortBy, sortDir }],
    queryFn: () =>
      api<ListResponse<SaleSummary>>(
        `/sales${buildQuery({ page, limit: pageLimit, from: asDayStart(from), to: asDayEnd(to), sortBy, sortDir })}`,
      ),
  });

  const clients = useQuery({
    queryKey: ['clients', 'options'],
    queryFn: () => api<ListResponse<Client>>('/clients?limit=100&sortBy=name&sortDir=asc'),
  });

  const products = useQuery({
    queryKey: ['products', 'options'],
    queryFn: () => api<ListResponse<Product>>('/products?limit=100&sortBy=name&sortDir=asc'),
  });

  const detailQueries = useQueries({
    queries: (sales.data?.data ?? []).map((sale) => ({
      queryKey: ['sales', sale.id],
      queryFn: () => api<Sale>(`/sales/${sale.id}`),
      enabled: Boolean(sales.data),
    })),
  });

  const saleDetails = useMemo(() => {
    const map = new Map<string, Sale>();
    detailQueries.forEach((query) => {
      if (query.data) {
        map.set(query.data.id, query.data);
      }
    });
    return map;
  }, [detailQueries]);

  const clientNames = useMemo(
    () => new Map((clients.data?.data ?? []).map((client) => [client.id, client.name])),
    [clients.data?.data],
  );
  const productNames = useMemo(
    () => new Map((products.data?.data ?? []).map((product) => [product.id, `${product.sku} ${product.name}`])),
    [products.data?.data],
  );
  const selectedSale = selectedSaleId ? saleDetails.get(selectedSaleId) : null;

  const columns: DataTableColumn<SaleSummary>[] = [
    { key: 'createdAt', header: t('common.date'), sortable: true, render: (sale) => formatDate(sale.createdAt) },
    { key: 'seller', header: t('common.seller'), render: (sale) => (sale.sellerId === user?.id ? user.name : sale.sellerId.slice(0, 8)) },
    { key: 'client', header: t('common.client'), render: (sale) => (sale.clientId ? clientNames.get(sale.clientId) ?? sale.clientId.slice(0, 8) : t('common.walkIn')) },
    { key: 'total', header: t('common.total'), sortable: true, render: (sale) => formatCurrency(sale.total) },
    { key: 'items', header: t('common.items'), render: (sale) => saleDetails.get(sale.id)?.items.length ?? '...' },
  ];

  return (
    <section className="module-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t('module.sales')}</p>
          <h1>{t('page.sales.title')}</h1>
        </div>
        <RoleGate allow={['admin', 'vendedor']}>
          <Link className="button primary" to="/sales/new">{t('sale.newSale')}</Link>
        </RoleGate>
      </header>

      <div className="panel module-panel">
        <div className="toolbar">
          <FormField label={t('common.from')} type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} />
          <FormField label={t('common.to')} type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} />
        </div>
        <DataTable columns={columns} rows={sales.data?.data ?? []} getRowKey={(sale) => sale.id} loading={sales.isLoading} sortBy={sortBy} sortDir={sortDir} onSort={(nextSortBy, nextSortDir) => { setSortBy(nextSortBy); setSortDir(nextSortDir); }} onRowClick={(sale) => setSelectedSaleId(sale.id)} />
        <Pagination page={page} limit={sales.data?.limit ?? pageLimit} total={sales.data?.total ?? 0} onPageChange={setPage} />
      </div>

      <Modal open={Boolean(selectedSaleId)} title={t('sale.saleDetails')} onClose={() => setSelectedSaleId(null)} size="wide">
        <div className="modal-body">
          {selectedSale ? (
            <>
              <div className="detail-grid">
                <span>{t('common.date')}</span><strong>{formatDate(selectedSale.createdAt)}</strong>
                <span>{t('common.client')}</span><strong>{selectedSale.clientId ? clientNames.get(selectedSale.clientId) ?? selectedSale.clientId : t('common.walkIn')}</strong>
                <span>{t('common.total')}</span><strong>{formatCurrency(selectedSale.total)}</strong>
              </div>
              <DataTable
                columns={[
                  { key: 'product', header: t('common.product'), render: (item) => productNames.get(item.productId) ?? item.productId },
                  { key: 'qty', header: t('common.qty'), render: (item) => item.qty },
                  { key: 'unitPrice', header: t('common.unitPrice'), render: (item) => formatCurrency(item.unitPrice) },
                  { key: 'lineTotal', header: t('sale.lineTotal'), render: (item) => formatCurrency(Number(item.unitPrice) * item.qty) },
                ]}
                rows={selectedSale.items}
                getRowKey={(item) => item.id}
              />
            </>
          ) : (
            <p>{t('sale.loadingSale')}</p>
          )}
        </div>
      </Modal>
    </section>
  );
}
