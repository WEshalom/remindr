import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

function SearchBar({ value = '', onChange, placeholder = 'Search...' }) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef(null);

  // Sync local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange
  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce
    debounceRef.current = setTimeout(() => {
      onChange?.(newValue);
    }, 300);
  };

  // Clear search
  const handleClear = () => {
    setLocalValue('');
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    onChange?.('');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="w-4.5 h-4.5 text-slate-500" />
      </div>
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="
          w-full bg-[#0f172a] border border-slate-700 rounded-lg
          text-sm text-slate-100 placeholder:text-slate-500
          pl-10 pr-9 py-2.5
          transition-colors duration-150
          hover:border-slate-600
          focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
        "
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default SearchBar;
