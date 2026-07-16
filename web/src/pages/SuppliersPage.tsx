import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RoleGate } from '../auth';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DataTable, DataTableColumn } from '../components/DataTable';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { SearchInput } from '../components/SearchInput';
import { api } from '../lib/api';
import { ListResponse, SortDir, Supplier } from '../lib/types';
import { formatDate } from '../utils/format';
import { buildQuery, optionalValue, pageLimit, toErrorMessage } from './pageUtils';

type SupplierForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

const emptyForm: SupplierForm = { name: '', email: '', phone: '', address: '' };

export function SuppliersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const suppliers = useQuery({
    queryKey: ['suppliers', { page, search, sortBy, sortDir }],
    queryFn: () =>
      api<ListResponse<Supplier>>(`/suppliers${buildQuery({ page, limit: pageLimit, search, sortBy, sortDir })}`),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: SupplierForm) => {
      const body = {
        name: payload.name.trim(),
        email: optionalValue(payload.email),
        phone: optionalValue(payload.phone),
        address: optionalValue(payload.address),
      };
      return editing
        ? api<Supplier>(`/suppliers/${editing.id}`, { method: 'PATCH', body })
        : api<Supplier>('/suppliers', { method: 'POST', body });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      closeForm();
    },
    onError: (error) => setFormError(toErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (supplier: Supplier) => api<void>(`/suppliers/${supplier.id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDeleteTarget(null);
    },
    onError: (error) => setDeleteError(toErrorMessage(error)),
  });

  const columns: DataTableColumn<Supplier>[] = [
    { key: 'name', header: 'Name', sortable: true, render: (supplier) => supplier.name },
    { key: 'email', header: 'Email', sortable: true, render: (supplier) => supplier.email ?? '-' },
    { key: 'phone', header: 'Phone', render: (supplier) => supplier.phone ?? '-' },
    { key: 'createdAt', header: 'Created', sortable: true, render: (supplier) => formatDate(supplier.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (supplier) => (
        <RoleGate allow={['admin', 'almacen']}>
          <div className="row-actions">
            <button type="button" className="ghost" onClick={() => openEdit(supplier)}>Edit</button>
            <button type="button" className="ghost danger-text" onClick={() => openDelete(supplier)}>Delete</button>
          </div>
        </RoleGate>
      ),
    },
  ];

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      email: supplier.email ?? '',
      phone: supplier.phone ?? '',
      address: supplier.address ?? '',
    });
    setFormError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(false);
  }

  function openDelete(supplier: Supplier) {
    setDeleteTarget(supplier);
    setDeleteError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError('Name is required.');
      return;
    }

    saveMutation.mutate(form);
  }

  return (
    <section className="module-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1>Suppliers</h1>
        </div>
        <RoleGate allow={['admin', 'almacen']}>
          <button type="button" className="primary" onClick={openCreate}>New supplier</button>
        </RoleGate>
      </header>

      <div className="panel module-panel">
        <div className="toolbar">
          <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search suppliers" />
        </div>
        <DataTable columns={columns} rows={suppliers.data?.data ?? []} getRowKey={(supplier) => supplier.id} loading={suppliers.isLoading} sortBy={sortBy} sortDir={sortDir} onSort={(nextSortBy, nextSortDir) => { setSortBy(nextSortBy); setSortDir(nextSortDir); }} />
        <Pagination page={page} limit={suppliers.data?.limit ?? pageLimit} total={suppliers.data?.total ?? 0} onPageChange={setPage} />
      </div>

      <Modal open={formOpen} title={editing ? 'Edit supplier' : 'New supplier'} onClose={closeForm}>
        <form onSubmit={handleSubmit}>
          <div className="modal-body form-grid">
            <FormField label="Name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            <FormField label="Email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            <FormField label="Phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            <FormField label="Address" as="textarea" rows={3} value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
            {formError ? <div className="error-box">{formError}</div> : null}
          </div>
          <footer className="modal-actions">
            <button type="button" className="ghost" onClick={closeForm}>Cancel</button>
            <button type="submit" className="primary" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : 'Save'}</button>
          </footer>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleteTarget)} title="Delete supplier" message={`Delete ${deleteTarget?.name ?? 'this supplier'}?`} loading={deleteMutation.isPending} error={deleteError} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)} />
    </section>
  );
}
