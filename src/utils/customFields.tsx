import type { Schema } from '../../amplify/data/resource';

export type CustomFieldType = Schema['CustomField']['type'];
export type CustomFieldValueType = Schema['CustomFieldValue']['type'];

/**
 * Renders a custom field input based on its field type
 */
export function renderCustomFieldInput(
  field: CustomFieldType,
  value: string | number | boolean | null | undefined,
  onChange: (value: string) => void,
  error?: string
): JSX.Element {
  const fieldId = `custom-field-${field.id}`;
  const fieldValue = value !== null && value !== undefined ? String(value) : (field.defaultValue || '');

  switch (field.fieldType) {
    case 'text':
      return (
        <div key={field.id} className="form-group">
          <label htmlFor={fieldId}>
            {field.label}
            {field.isRequired && <span className="required">*</span>}
          </label>
          <input
            type="text"
            id={fieldId}
            value={fieldValue}
            onChange={(e) => onChange(e.target.value)}
            required={field.isRequired === true}
            maxLength={255}
            aria-invalid={!!error}
          />
          {error && <span className="error-message">{error}</span>}
        </div>
      );

    case 'textarea':
      return (
        <div key={field.id} className="form-group">
          <label htmlFor={fieldId}>
            {field.label}
            {field.isRequired && <span className="required">*</span>}
          </label>
          <textarea
            id={fieldId}
            value={fieldValue}
            onChange={(e) => onChange(e.target.value)}
            required={field.isRequired === true}
            rows={4}
            maxLength={1000}
            aria-invalid={!!error}
          />
          {error && <span className="error-message">{error}</span>}
        </div>
      );

    case 'number':
      return (
        <div key={field.id} className="form-group">
          <label htmlFor={fieldId}>
            {field.label}
            {field.isRequired && <span className="required">*</span>}
          </label>
          <input
            type="number"
            id={fieldId}
            value={fieldValue}
            onChange={(e) => onChange(e.target.value)}
            required={field.isRequired === true}
            step="any"
            aria-invalid={!!error}
          />
          {error && <span className="error-message">{error}</span>}
        </div>
      );

    case 'date':
      return (
        <div key={field.id} className="form-group">
          <label htmlFor={fieldId}>
            {field.label}
            {field.isRequired && <span className="required">*</span>}
          </label>
          <input
            type="date"
            id={fieldId}
            value={fieldValue}
            onChange={(e) => onChange(e.target.value)}
            required={field.isRequired === true}
            aria-invalid={!!error}
          />
          {error && <span className="error-message">{error}</span>}
        </div>
      );

    case 'datetime':
      return (
        <div key={field.id} className="form-group">
          <label htmlFor={fieldId}>
            {field.label}
            {field.isRequired && <span className="required">*</span>}
          </label>
          <input
            type="datetime-local"
            id={fieldId}
            value={fieldValue}
            onChange={(e) => onChange(e.target.value)}
            required={field.isRequired === true}
            aria-invalid={!!error}
          />
          {error && <span className="error-message">{error}</span>}
        </div>
      );

    case 'boolean':
      return (
        <div key={field.id} className="form-group">
          <label>
            <input
              type="checkbox"
              id={fieldId}
              checked={fieldValue === 'true' || fieldValue === '1' || fieldValue === 'yes'}
              onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
              required={field.isRequired === true}
              aria-invalid={!!error}
            />
            {field.label}
            {field.isRequired && <span className="required">*</span>}
          </label>
          {error && <span className="error-message">{error}</span>}
        </div>
      );

    case 'select':
      const options = field.options ? (() => {
        try {
          return JSON.parse(field.options);
        } catch {
          return [];
        }
      })() : [];
      
      return (
        <div key={field.id} className="form-group">
          <label htmlFor={fieldId}>
            {field.label}
            {field.isRequired && <span className="required">*</span>}
          </label>
          <select
            id={fieldId}
            value={fieldValue}
            onChange={(e) => onChange(e.target.value)}
            required={field.isRequired === true}
            aria-invalid={!!error}
          >
            <option value="">-- Select --</option>
            {options.map((opt: string, idx: number) => (
              <option key={idx} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {error && <span className="error-message">{error}</span>}
        </div>
      );

    default:
      return <div key={field.id}>Unknown field type: {field.fieldType}</div>;
  }
}

/**
 * Validates a custom field value
 */
export function validateCustomFieldValue(
  field: CustomFieldType,
  value: string | null | undefined
): { isValid: boolean; error?: string } {
  if (field.isRequired && (!value || value.trim() === '')) {
    return { isValid: false, error: `${field.label} is required` };
  }

  if (value && field.fieldType === 'number') {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return { isValid: false, error: `${field.label} must be a valid number` };
    }
  }

  return { isValid: true };
}

/**
 * Parses a custom field value based on its type
 */
export function parseCustomFieldValue(
  field: CustomFieldType,
  value: string
): string | number | boolean | null {
  if (!value || value.trim() === '') {
    return field.defaultValue || null;
  }

  switch (field.fieldType) {
    case 'number':
      const num = Number(value);
      return isNaN(num) ? null : num;
    case 'boolean':
      return value === 'true' || value === '1' || value === 'yes';
    case 'date':
    case 'datetime':
    case 'text':
    case 'textarea':
    case 'select':
    default:
      return value;
  }
}

/**
 * Formats a custom field value for display
 */
export function formatCustomFieldValue(
  field: CustomFieldType,
  value: string | number | boolean | null | undefined
): string {
  if (value === null || value === undefined) {
    return field.defaultValue || '';
  }

  if (field.fieldType === 'boolean') {
    return value === true || value === 'true' || value === '1' || value === 'yes' ? 'Yes' : 'No';
  }

  return String(value);
}
