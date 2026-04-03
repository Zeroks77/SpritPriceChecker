import { useState, useRef, useEffect, useCallback } from 'react';
import { geocode } from '../utils/geocode';

export default function LocationSearch({ onLocationSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

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
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  }

  function handleSelect(item) {
    setQuery(item.displayName.split(',')[0]);
    setResults([]);
    setOpen(false);
    onLocationSelect({ lat: item.lat, lng: item.lng });
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      clearTimeout(debounceRef.current);
      search(query);
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  // Close dropdown when clicking outside
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
    <div ref={wrapperRef} className="relative flex-1 max-w-xs">
      <div className="flex items-center bg-white/10 border border-white/30 rounded-lg px-2 gap-1.5">
        <span className="text-white/70 text-sm shrink-0">🔍</span>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ort oder PLZ eingeben…"
          className="flex-1 bg-transparent text-white text-sm placeholder-white/60 py-1.5 focus:outline-none min-w-0"
        />
        {loading && <span className="text-white/60 text-xs shrink-0 animate-spin">⟳</span>}
        {query && !loading && (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
            className="text-white/60 hover:text-white text-sm shrink-0"
            title="Löschen"
          >
            ✕
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[1000] overflow-hidden max-h-52 overflow-y-auto">
          {results.map((item, i) => (
            <li key={i}>
              <button
                onClick={() => handleSelect(item)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-800 transition-colors border-b border-gray-100 last:border-0"
              >
                <span className="font-medium">{item.displayName.split(',')[0]}</span>
                <span className="text-gray-400 text-xs ml-1">
                  {item.displayName.split(',').slice(1, 3).join(',')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
