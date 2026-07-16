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
import { Client, ListResponse, SortDir } from '../lib/types';
import { formatDate } from '../utils/format';
import { buildQuery, optionalValue, pageLimit, toErrorMessage } from './pageUtils';

type ClientForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

const emptyForm: ClientForm = { name: '', email: '', phone: '', address: '' };

export function ClientsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const clients = useQuery({
    queryKey: ['clients', { page, search, sortBy, sortDir }],
    queryFn: () => api<ListResponse<Client>>(`/clients${buildQuery({ page, limit: pageLimit, search, sortBy, sortDir })}`),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: ClientForm) => {
      const body = {
        name: payload.name.trim(),
        email: optionalValue(payload.email),
        phone: optionalValue(payload.phone),
        address: optionalValue(payload.address),
      };
      return editing
        ? api<Client>(`/clients/${editing.id}`, { method: 'PATCH', body })
        : api<Client>('/clients', { method: 'POST', body });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      closeForm();
    },
    onError: (error) => setFormError(toErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (client: Client) => api<void>(`/clients/${client.id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      setDeleteTarget(null);
    },
    onError: (error) => setDeleteError(toErrorMessage(error)),
  });

  const columns: DataTableColumn<Client>[] = [
    { key: 'name', header: 'Name', sortable: true, render: (client) => client.name },
    { key: 'email', header: 'Email', sortable: true, render: (client) => client.email ?? '-' },
    { key: 'phone', header: 'Phone', render: (client) => client.phone ?? '-' },
    { key: 'createdAt', header: 'Created', sortable: true, render: (client) => formatDate(client.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (client) => (
        <RoleGate allow={['admin', 'vendedor']}>
          <div className="row-actions">
            <button type="button" className="ghost" onClick={() => openEdit(client)}>Edit</button>
            <button type="button" className="ghost danger-text" onClick={() => openDelete(client)}>Delete</button>
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

  function openEdit(client: Client) {
    setEditing(client);
    setForm({
      name: client.name,
      email: client.email ?? '',
      phone: client.phone ?? '',
      address: client.address ?? '',
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

  function openDelete(client: Client) {
    setDeleteTarget(client);
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
          <p className="eyebrow">Sales</p>
          <h1>Clients</h1>
        </div>
        <RoleGate allow={['admin', 'vendedor']}>
          <button type="button" className="primary" onClick={openCreate}>New client</button>
        </RoleGate>
      </header>

      <div className="panel module-panel">
        <div className="toolbar">
          <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search clients" />
        </div>
        <DataTable columns={columns} rows={clients.data?.data ?? []} getRowKey={(client) => client.id} loading={clients.isLoading} sortBy={sortBy} sortDir={sortDir} onSort={(nextSortBy, nextSortDir) => { setSortBy(nextSortBy); setSortDir(nextSortDir); }} />
        <Pagination page={page} limit={clients.data?.limit ?? pageLimit} total={clients.data?.total ?? 0} onPageChange={setPage} />
      </div>

      <Modal open={formOpen} title={editing ? 'Edit client' : 'New client'} onClose={closeForm}>
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

      <ConfirmDialog open={Boolean(deleteTarget)} title="Delete client" message={`Delete ${deleteTarget?.name ?? 'this client'}?`} loading={deleteMutation.isPending} error={deleteError} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)} />
    </section>
  );
}
