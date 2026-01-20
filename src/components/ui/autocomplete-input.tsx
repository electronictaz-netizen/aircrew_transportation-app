/**
 * Autocomplete Input Component
 * A reusable autocomplete input component for addresses and other suggestions
 */

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Input } from './input';

export interface AutocompleteOption {
  value: string;
  label: string;
  secondaryLabel?: string;
}

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (option: AutocompleteOption) => void;
  placeholder?: string;
  options: AutocompleteOption[];
  isLoading?: boolean;
  maxLength?: number;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export function AutocompleteInput({
  value,
  onChange,
  onSelect,
  placeholder,
  options,
  isLoading = false,
  maxLength,
  className = '',
  disabled = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    if (options.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow option click to register
    setTimeout(() => setIsOpen(false), 200);
  };

  const handleSelect = (option: AutocompleteOption) => {
    onChange(option.value);
    if (onSelect) {
      onSelect(option);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || options.length === 0) {
      if (e.key === 'ArrowDown' && options.length > 0) {
        setIsOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleSelect(options[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(value.toLowerCase()) ||
    option.value.toLowerCase().includes(value.toLowerCase())
  );

  const displayOptions = filteredOptions.length > 0 ? filteredOptions : options;
  const showDropdown = isOpen && (displayOptions.length > 0 || isLoading);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={showDropdown ? 'autocomplete-list' : undefined}
        aria-activedescendant={
          highlightedIndex >= 0 ? `autocomplete-option-${highlightedIndex}` : undefined
        }
      />
      
      {showDropdown && (
        <ul
          ref={listRef}
          id="autocomplete-list"
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {isLoading ? (
            <li className="px-4 py-2 text-sm text-gray-500">Loading suggestions...</li>
          ) : (
            displayOptions.map((option, index) => (
              <li
                key={`${option.value}-${index}`}
                id={`autocomplete-option-${index}`}
                role="option"
                aria-selected={highlightedIndex === index}
                className={`px-4 py-2 cursor-pointer text-sm ${
                  highlightedIndex === index
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="font-medium">{option.label}</div>
                {option.secondaryLabel && (
                  <div className="text-xs text-gray-500 mt-0.5">{option.secondaryLabel}</div>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
