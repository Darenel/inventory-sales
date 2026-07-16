import { FormEvent, useState } from 'react';
import { FormField } from '../components/FormField';
import { isDemoMode } from '../lib/api';
import { downloadAuthenticated } from '../utils/download';
import { buildQuery, toErrorMessage } from './pageUtils';

type ReportFormat = 'csv' | 'pdf';

function asDayEnd(value: string) {
  return value ? new Date(`${value}T23:59:59.999`).toISOString() : undefined;
}

function asDayStart(value: string) {
  return value ? new Date(`${value}T00:00:00.000`).toISOString() : undefined;
}

export function ReportsPage() {
  const [salesFrom, setSalesFrom] = useState('');
  const [salesTo, setSalesTo] = useState('');
  const [salesFormat, setSalesFormat] = useState<ReportFormat>('csv');
  const [stockFormat, setStockFormat] = useState<ReportFormat>('csv');
  const [salesError, setSalesError] = useState<string | null>(null);
  const [stockError, setStockError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  async function handleSales(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSalesError(null);
    setDownloading('sales');

    try {
      await downloadAuthenticated(
        `/reports/sales${buildQuery({ from: asDayStart(salesFrom), to: asDayEnd(salesTo), format: salesFormat })}`,
        `sales.${salesFormat}`,
      );
    } catch (error) {
      setSalesError(toErrorMessage(error, 'Could not download sales report.'));
    } finally {
      setDownloading(null);
    }
  }

  async function handleStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStockError(null);
    setDownloading('stock');

    try {
      await downloadAuthenticated(`/reports/stock${buildQuery({ format: stockFormat })}`, `stock.${stockFormat}`);
    } catch (error) {
      setStockError(toErrorMessage(error, 'Could not download stock report.'));
    } finally {
      setDownloading(null);
    }
  }

  return (
    <section className="module-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Exports</p>
          <h1>Reports</h1>
        </div>
      </header>

      <div className="reports-grid">
        <form className="panel report-card" onSubmit={handleSales}>
          <h2>Sales report</h2>
          <div className="form-grid">
            <FormField label="From" type="date" value={salesFrom} onChange={(event) => setSalesFrom(event.target.value)} />
            <FormField label="To" type="date" value={salesTo} onChange={(event) => setSalesTo(event.target.value)} />
            <FormField label="Format" as="select" value={salesFormat} onChange={(event) => setSalesFormat(event.target.value as ReportFormat)}>
              <option value="csv">CSV</option>
              {!isDemoMode ? <option value="pdf">PDF</option> : null}
            </FormField>
            {isDemoMode ? <p className="muted-text">Demo reports export CSV only.</p> : null}
          </div>
          {salesError ? <div className="error-box">{salesError}</div> : null}
          <button type="submit" className="primary" disabled={downloading === 'sales'}>
            {downloading === 'sales' ? 'Downloading...' : 'Download'}
          </button>
        </form>

        <form className="panel report-card" onSubmit={handleStock}>
          <h2>Stock report</h2>
          <div className="form-grid">
            <FormField label="Format" as="select" value={stockFormat} onChange={(event) => setStockFormat(event.target.value as ReportFormat)}>
              <option value="csv">CSV</option>
              {!isDemoMode ? <option value="pdf">PDF</option> : null}
            </FormField>
            {isDemoMode ? <p className="muted-text">Demo reports export CSV only.</p> : null}
          </div>
          {stockError ? <div className="error-box">{stockError}</div> : null}
          <button type="submit" className="primary" disabled={downloading === 'stock'}>
            {downloading === 'stock' ? 'Downloading...' : 'Download'}
          </button>
        </form>
      </div>
    </section>
  );
}
