import React, { useEffect, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function SearchBar({ searchQuery, onSearchChange }: SearchBarProps) {
  const [showClear, setShowClear] = useState(false);

  useEffect(() => {
    setShowClear(searchQuery.length > 0);
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onSearchChange("");
    }
  };

  return (
    <div className="relative flex items-center w-full mb-3 mt-2">
      {/* Icon */}
      <FiSearch className="absolute left-3 text-gray-400 pointer-events-none" />

      {/* Input */}
      <input
        type="text"
        placeholder="Search files..."
        className="pl-10 pr-10 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Search files"
      />

      {/* Clear Button */}
      {showClear && (
        <button
          className="absolute right-3 text-gray-500 hover:text-red-500 transition-colors"
          onClick={() => onSearchChange("")}
          aria-label="Clear search"
        >
          <FiX />
        </button>
      )}
    </div>
  );
}
