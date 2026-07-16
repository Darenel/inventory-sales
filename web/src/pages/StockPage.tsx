import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RoleGate } from '../auth';
import { DataTable, DataTableColumn } from '../components/DataTable';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { api } from '../lib/api';
import { ListResponse, Product, SortDir, StockAlertsResponse, StockMovement, StockMovementType } from '../lib/types';
import { formatDate } from '../utils/format';
import { buildQuery, pageLimit, toErrorMessage } from './pageUtils';

type AdjustmentForm = {
  productId: string;
  qty: string;
  reason: string;
};

const emptyForm: AdjustmentForm = { productId: '', qty: '', reason: '' };

export function StockPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [productId, setProductId] = useState('');
  const [type, setType] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<AdjustmentForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const movements = useQuery({
    queryKey: ['stock-movements', { page, productId, type, sortBy, sortDir }],
    queryFn: () =>
      api<ListResponse<StockMovement>>(
        `/stock/movements${buildQuery({ page, limit: pageLimit, productId, type, sortBy, sortDir })}`,
      ),
  });

  const products = useQuery({
    queryKey: ['products', 'options'],
    queryFn: () => api<ListResponse<Product>>('/products?limit=100&sortBy=name&sortDir=asc'),
  });

  const alerts = useQuery({
    queryKey: ['stock-alerts'],
    queryFn: () => api<StockAlertsResponse>('/stock/alerts'),
    refetchInterval: 30000,
  });

  const productNames = useMemo(
    () => new Map((products.data?.data ?? []).map((product) => [product.id, `${product.sku} ${product.name}`])),
    [products.data?.data],
  );

  const createAdjustment = useMutation({
    mutationFn: (payload: AdjustmentForm) =>
      api<StockMovement>('/stock/adjustments', {
        method: 'POST',
        body: {
          productId: payload.productId,
          qty: Number(payload.qty),
          reason: payload.reason.trim(),
        },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['stock-movements'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['stock-alerts'] }),
      ]);
      closeForm();
    },
    onError: (error) => setFormError(toErrorMessage(error)),
  });

  const movementColumns: DataTableColumn<StockMovement>[] = [
    { key: 'product', header: 'Product', render: (movement) => productNames.get(movement.productId) ?? movement.productId },
    {
      key: 'type',
      header: 'Type',
      render: (movement) => <span className={`badge badge-${movement.type}`}>{movement.type}</span>,
    },
    {
      key: 'qty',
      header: 'Qty',
      sortable: true,
      render: (movement) => <span className={movement.qty < 0 ? 'danger-text' : 'success-text'}>{movement.qty > 0 ? `+${movement.qty}` : movement.qty}</span>,
    },
    { key: 'reason', header: 'Reason', render: (movement) => movement.reason ?? '-' },
    { key: 'user', header: 'User', render: (movement) => movement.userId.slice(0, 8) },
    { key: 'createdAt', header: 'Date', sortable: true, render: (movement) => formatDate(movement.createdAt) },
  ];

  const alertColumns: DataTableColumn<Product>[] = [
    { key: 'sku', header: 'SKU', render: (product) => product.sku },
    { key: 'name', header: 'Name', render: (product) => product.name },
    { key: 'stock', header: 'Stock', render: (product) => <span className="badge badge-coral">{product.stock} / {product.minStock}</span> },
  ];

  function openForm() {
    setForm({ ...emptyForm, productId: products.data?.data[0]?.id ?? '' });
    setFormError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!form.productId) {
      setFormError('Product is required.');
      return;
    }

    if (!Number.isInteger(Number(form.qty)) || Number(form.qty) === 0) {
      setFormError('Quantity must be a non-zero whole number.');
      return;
    }

    if (!form.reason.trim()) {
      setFormError('Reason is required.');
      return;
    }

    createAdjustment.mutate(form);
  }

  return (
    <section className="module-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Stock</p>
          <h1>Stock</h1>
        </div>
        <RoleGate allow={['admin', 'almacen']}>
          <button type="button" className="primary" onClick={openForm}>New adjustment</button>
        </RoleGate>
      </header>

      <div className="stock-grid">
        <div className="panel module-panel">
          <div className="section-heading">
            <h2>Movements</h2>
          </div>
          <div className="toolbar">
            <select value={productId} onChange={(event) => { setProductId(event.target.value); setPage(1); }} aria-label="Filter by product">
              <option value="">All products</option>
              {(products.data?.data ?? []).map((product) => <option key={product.id} value={product.id}>{product.sku} {product.name}</option>)}
            </select>
            <select value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} aria-label="Filter by movement type">
              <option value="">All types</option>
              {(['purchase', 'sale', 'adjustment'] satisfies StockMovementType[]).map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          <DataTable columns={movementColumns} rows={movements.data?.data ?? []} getRowKey={(movement) => movement.id} loading={movements.isLoading} sortBy={sortBy} sortDir={sortDir} onSort={(nextSortBy, nextSortDir) => { setSortBy(nextSortBy); setSortDir(nextSortDir); }} />
          <Pagination page={page} limit={movements.data?.limit ?? pageLimit} total={movements.data?.total ?? 0} onPageChange={setPage} />
        </div>

        <div className="panel module-panel">
          <div className="section-heading">
            <h2>Alerts</h2>
            <span className="badge badge-coral">{alerts.data?.total ?? 0}</span>
          </div>
          <DataTable columns={alertColumns} rows={alerts.data?.data ?? []} getRowKey={(product) => product.id} loading={alerts.isLoading} emptyMessage="No low-stock products." />
        </div>
      </div>

      <Modal open={formOpen} title="New adjustment" onClose={closeForm}>
        <form onSubmit={handleSubmit}>
          <div className="modal-body form-grid">
            <FormField label="Product" as="select" value={form.productId} onChange={(event) => setForm((current) => ({ ...current, productId: event.target.value }))} required>
              <option value="">Select product</option>
              {(products.data?.data ?? []).map((product) => <option key={product.id} value={product.id}>{product.sku} {product.name}</option>)}
            </FormField>
            <FormField label="Signed quantity" type="number" step="1" value={form.qty} onChange={(event) => setForm((current) => ({ ...current, qty: event.target.value }))} required />
            <FormField label="Reason" as="textarea" rows={3} value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} required />
            {formError ? <div className="error-box">{formError}</div> : null}
          </div>
          <footer className="modal-actions">
            <button type="button" className="ghost" onClick={closeForm}>Cancel</button>
            <button type="submit" className="primary" disabled={createAdjustment.isPending}>{createAdjustment.isPending ? 'Saving...' : 'Save'}</button>
          </footer>
        </form>
      </Modal>
    </section>
  );
}
