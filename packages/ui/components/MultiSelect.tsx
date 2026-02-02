"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  id: string;
  name: string;
  description?: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  label,
  required = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const removeOption = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((s) => s !== id));
  };

  const selectedOptions = options.filter((opt) => selected.includes(opt.id));

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-900 mb-1">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}

      {/* Selected items display / trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[42px] px-3 py-2 border border-gray-300 rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#005EB8] focus:border-transparent"
      >
        {selectedOptions.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selectedOptions.map((opt) => (
              <span
                key={opt.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-[#005EB8] text-white text-sm rounded"
              >
                {opt.name}
                <button
                  type="button"
                  onClick={(e) => removeOption(opt.id, e)}
                  className="hover:bg-[#004a93] rounded-full p-0.5"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#005EB8]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options list */}
          <ul className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = selected.includes(opt.id);
                return (
                  <li
                    key={opt.id}
                    onClick={() => toggleOption(opt.id)}
                    className={`px-3 py-2 cursor-pointer flex items-center gap-2 hover:bg-gray-100 ${
                      isSelected ? "bg-blue-50" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 text-[#005EB8] border-gray-300 rounded focus:ring-[#005EB8]"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{opt.name}</p>
                      {opt.description && (
                        <p className="text-xs text-gray-600">{opt.description}</p>
                      )}
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="px-3 py-2 text-sm text-gray-500">No options found</li>
            )}
          </ul>

          {/* Footer with count */}
          <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 text-sm text-gray-700">
            {selected.length} of {options.length} selected
          </div>
        </div>
      )}
    </div>
  );
}

export default MultiSelect;
