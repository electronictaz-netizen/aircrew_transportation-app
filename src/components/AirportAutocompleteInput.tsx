/**
 * Airport Autocomplete Input Component
 * Wraps AutocompleteInput with airport-specific logic
 */

import { useMemo } from 'react';
import { AutocompleteInput, AutocompleteOption } from './ui/autocomplete-input';
import { searchAirports } from '../utils/airportAutocomplete';

interface AirportAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (airportCode: string, airportName: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export function AirportAutocompleteInput({
  value,
  onChange,
  onSelect,
  placeholder = 'Enter airport code or name',
  maxLength,
  className = '',
  disabled = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: AirportAutocompleteInputProps) {
  // Get airport suggestions based on current value
  const options = useMemo<AutocompleteOption[]>(() => {
    if (!value || value.trim().length === 0) {
      // Show top 10 airports when empty
      const airports = searchAirports('', 10);
      return airports.map(airport => ({
        value: airport.fullName,
        label: `${airport.code} - ${airport.name}`,
        secondaryLabel: `${airport.city}${airport.state ? `, ${airport.state}` : ''}, ${airport.country}`,
      }));
    }

    const airports = searchAirports(value, 10);
    return airports.map(airport => ({
      value: airport.fullName,
      label: `${airport.code} - ${airport.name}`,
      secondaryLabel: `${airport.city}${airport.state ? `, ${airport.state}` : ''}, ${airport.country}`,
    }));
  }, [value]);

  const handleSelect = (option: AutocompleteOption) => {
    onChange(option.value);
    if (onSelect) {
      // Extract airport code from the value (format: "CODE - Name")
      const codeMatch = option.value.match(/^([A-Z]{3})\s*-/);
      const code = codeMatch ? codeMatch[1] : '';
      const name = option.value.replace(/^[A-Z]{3}\s*-\s*/, '');
      onSelect(code, name);
    }
  };

  return (
    <AutocompleteInput
      value={value}
      onChange={onChange}
      onSelect={handleSelect}
      placeholder={placeholder}
      options={options}
      isLoading={false}
      maxLength={maxLength}
      className={className}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    />
  );
}
