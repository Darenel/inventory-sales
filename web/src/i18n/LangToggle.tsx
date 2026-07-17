import { useI18n } from './I18nContext';

export function LangToggle() {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="lang-toggle" aria-label={t('nav.language')}>
      <button type="button" className={lang === 'en' ? 'active' : undefined} onClick={() => setLang('en')}>
        EN
      </button>
      <span aria-hidden="true">/</span>
      <button type="button" className={lang === 'es' ? 'active' : undefined} onClick={() => setLang('es')}>
        ES
      </button>
    </div>
  );
}
