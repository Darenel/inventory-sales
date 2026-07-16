import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, useId } from 'react';

type BaseProps = {
  label: string;
  error?: string;
};

type InputProps = BaseProps &
  InputHTMLAttributes<HTMLInputElement> & {
    as?: 'input';
  };

type SelectProps = BaseProps &
  SelectHTMLAttributes<HTMLSelectElement> & {
    as: 'select';
    children: React.ReactNode;
  };

type TextareaProps = BaseProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    as: 'textarea';
  };

type FormFieldProps = InputProps | SelectProps | TextareaProps;

export function FormField(props: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  if (props.as === 'select') {
    const { label, error, children, ...selectProps } = props;
    return (
      <label htmlFor={id}>
        {label}
        <select id={id} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} {...selectProps}>
          {children}
        </select>
        {error ? <span className="field-error" id={errorId}>{error}</span> : null}
      </label>
    );
  }

  if (props.as === 'textarea') {
    const { label, error, ...textareaProps } = props;
    return (
      <label htmlFor={id}>
        {label}
        <textarea id={id} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} {...textareaProps} />
        {error ? <span className="field-error" id={errorId}>{error}</span> : null}
      </label>
    );
  }

  const { label, error, as: _as, ...inputProps } = props;
  return (
    <label htmlFor={id}>
      {label}
      <input id={id} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} {...inputProps} />
      {error ? <span className="field-error" id={errorId}>{error}</span> : null}
    </label>
  );
}
