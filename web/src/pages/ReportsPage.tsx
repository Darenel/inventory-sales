import { FormEvent, useState } from 'react';
import { FormField } from '../components/FormField';
import { useI18n } from '../i18n/I18nContext';
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
  const { t } = useI18n();
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
      setSalesError(toErrorMessage(error, t('reports.couldNotDownloadSales')));
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
      setStockError(toErrorMessage(error, t('reports.couldNotDownloadStock')));
    } finally {
      setDownloading(null);
    }
  }

  return (
    <section className="module-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t('common.exports')}</p>
          <h1>{t('reports.reportsTitle')}</h1>
        </div>
      </header>

      <div className="reports-grid">
        <form className="panel report-card" onSubmit={handleSales}>
          <h2>{t('reports.salesReport')}</h2>
          <div className="form-grid">
            <FormField label={t('common.from')} type="date" value={salesFrom} onChange={(event) => setSalesFrom(event.target.value)} />
            <FormField label={t('common.to')} type="date" value={salesTo} onChange={(event) => setSalesTo(event.target.value)} />
            <FormField label={t('common.format')} as="select" value={salesFormat} onChange={(event) => setSalesFormat(event.target.value as ReportFormat)}>
              <option value="csv">{t('reports.formatCsv')}</option>
              {!isDemoMode ? <option value="pdf">{t('reports.formatPdf')}</option> : null}
            </FormField>
            {isDemoMode ? <p className="muted-text">{t('reports.demoCsvOnly')}</p> : null}
          </div>
          {salesError ? <div className="error-box">{salesError}</div> : null}
          <button type="submit" className="primary" disabled={downloading === 'sales'}>
            {downloading === 'sales' ? t('common.downloading') : t('common.download')}
          </button>
        </form>

        <form className="panel report-card" onSubmit={handleStock}>
          <h2>{t('reports.stockReport')}</h2>
          <div className="form-grid">
            <FormField label={t('common.format')} as="select" value={stockFormat} onChange={(event) => setStockFormat(event.target.value as ReportFormat)}>
              <option value="csv">{t('reports.formatCsv')}</option>
              {!isDemoMode ? <option value="pdf">{t('reports.formatPdf')}</option> : null}
            </FormField>
            {isDemoMode ? <p className="muted-text">{t('reports.demoCsvOnly')}</p> : null}
          </div>
          {stockError ? <div className="error-box">{stockError}</div> : null}
          <button type="submit" className="primary" disabled={downloading === 'stock'}>
            {downloading === 'stock' ? t('common.downloading') : t('common.download')}
          </button>
        </form>
      </div>
    </section>
  );
}
