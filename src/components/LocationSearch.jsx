import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { geocode } from '../utils/geocode';

export default function LocationSearch({ onLocationSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);
  const listboxId = useId();

  const search = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const items = await geocode(q.trim());
      setResults(items);
      setOpen(items.length > 0);
      setFocusedIndex(-1);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val);
    setFocusedIndex(-1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  }

  function handleSelect(item) {
    setQuery(item.displayName.split(',')[0]);
    setResults([]);
    setOpen(false);
    setFocusedIndex(-1);
    onLocationSelect({ lat: item.lat, lng: item.lng });
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open && results.length > 0) setOpen(true);
      setFocusedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && results[focusedIndex]) {
        handleSelect(results[focusedIndex]);
      } else {
        clearTimeout(debounceRef.current);
        search(query);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setFocusedIndex(-1);
    }
  }

  function handleClear() {
    setQuery('');
    setResults([]);
    setOpen(false);
    setFocusedIndex(-1);
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full sm:flex-1 sm:max-w-xs">
      <div className="flex items-center bg-white/10 border border-white/30 rounded-lg px-2 gap-1.5">
        <span aria-hidden="true" className="text-white/70 text-sm shrink-0">🔍</span>
        <input
          type="search"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-activedescendant={
            focusedIndex >= 0 ? `${listboxId}-option-${focusedIndex}` : undefined
          }
          aria-label="Ort oder Postleitzahl suchen"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ort oder PLZ eingeben…"
          className="flex-1 bg-transparent text-white text-sm placeholder-white/60 py-1.5 focus:outline-none min-w-0"
        />
        {loading && (
          <span aria-hidden="true" className="text-white/60 text-xs shrink-0 animate-spin">⟳</span>
        )}
        {query && !loading && (
          <button
            onClick={handleClear}
            aria-label="Suche löschen"
            className="text-white/60 hover:text-white shrink-0 p-0.5"
          >
            <span aria-hidden="true">✕</span>
          </button>
        )}
      </div>

      {/* Live region for screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {open && results.length > 0 ? `${results.length} Ergebnisse gefunden` : ''}
        {!loading && query.trim().length >= 2 && results.length === 0 ? 'Keine Ergebnisse gefunden' : ''}
      </div>

      {open && results.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Suchergebnisse"
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] overflow-hidden max-h-52 overflow-y-auto"
        >
          {results.map((item, i) => (
            <li
              key={i}
              role="option"
              id={`${listboxId}-option-${i}`}
              aria-selected={i === focusedIndex}
              onMouseDown={(e) => {
                // prevent blur from firing before click
                e.preventDefault();
                handleSelect(item);
              }}
              className={`px-3 py-2.5 text-sm text-gray-700 cursor-pointer transition-colors border-b border-gray-100 last:border-0 ${
                i === focusedIndex
                  ? 'bg-blue-50 text-blue-800'
                  : 'hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <span className="font-medium">{item.displayName.split(',')[0]}</span>
              <span className="text-gray-400 text-xs ml-1">
                {item.displayName.split(',').slice(1, 3).join(',')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
