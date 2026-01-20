/**
 * Address Autocomplete Input Component
 * Wraps AutocompleteInput with address-specific logic
 */

import { useState, useEffect, useCallback } from 'react';
import { AutocompleteInput, AutocompleteOption } from './ui/autocomplete-input';
import { getAddressSuggestions } from '../utils/addressAutocomplete';
import { logger } from '../utils/logger';

interface AddressAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (address: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export function AddressAutocompleteInput({
  value,
  onChange,
  onSelect,
  placeholder = 'Enter address',
  maxLength,
  className = '',
  disabled = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: AddressAutocompleteInputProps) {
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Debounced search function
  const searchAddresses = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setOptions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const suggestions = await getAddressSuggestions(query);
      const autocompleteOptions: AutocompleteOption[] = suggestions.map((suggestion) => ({
        value: suggestion.description,
        label: suggestion.mainText || suggestion.description,
        secondaryLabel: suggestion.secondaryText,
      }));
      
      setOptions(autocompleteOptions);
    } catch (error) {
      logger.error('Error fetching address suggestions', { error, query });
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce the search
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      searchAddresses(value);
    }, 300); // 300ms debounce

    setDebounceTimer(timer);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [value, searchAddresses]);

  const handleSelect = (option: AutocompleteOption) => {
    onChange(option.value);
    if (onSelect) {
      onSelect(option.value);
    }
  };

  return (
    <AutocompleteInput
      value={value}
      onChange={onChange}
      onSelect={handleSelect}
      placeholder={placeholder}
      options={options}
      isLoading={isLoading}
      maxLength={maxLength}
      className={className}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    />
  );
}
