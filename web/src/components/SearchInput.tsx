import { ChangeEvent, useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
};

export function SearchInput({ value, onChange, placeholder, delay = 300 }: SearchInputProps) {
  const { t } = useI18n();
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const handle = window.setTimeout(() => onChange(localValue), delay);
    return () => window.clearTimeout(handle);
  }, [delay, localValue, onChange]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setLocalValue(event.target.value);
  }

  return (
    <input
      className="search-input"
      type="search"
      value={localValue}
      placeholder={placeholder ?? t('common.search')}
      onChange={handleChange}
    />
  );
}
