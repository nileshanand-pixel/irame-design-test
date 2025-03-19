import React, { useState } from "react";

const ComboBoxOnFire = ({
  options,
  onSelection,
  placeholder = "Select an option...",
}) => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  // Filtered options based on the query (keeping the group structure)
  const filteredOptions = query
    ? options
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            item.label.toLowerCase().includes(query.toLowerCase())
          ),
        }))
        .filter((group) => group.items.length > 0)
    : options;

  // Handle selection logic
  const handleSelection = (item) => {
    setSelected(item);
    setQuery(item.label); // show selected label in the input
    setIsOpen(false);
    if (onSelection) onSelection(item);
  };

  return (
    <div className="relative w-full max-w-md">
      {/* Input Field */}
      <div
        className="relative"
        onClick={() => setIsOpen((prev) => !prev)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)} // Close on blur with slight delay
      >
        <input
          type="text"
          className="w-full border border-gray-300 rounded-md pl-3 pr-10 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center pr-2"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <svg
            className="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Dropdown List */}
      {isOpen && (
        <div className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((group) => (
              <div key={group.group} className="border-b border-gray-200">
                {/* Group Label */}
                <div className="bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
                  {group.group}
                </div>
                {/* Group Items */}
                {group.items.map((item) => (
                  <div
                    key={item.value}
                    onClick={() => handleSelection(item)}
                    className="cursor-pointer select-none py-2 pl-6 pr-4 hover:bg-indigo-600 hover:text-white"
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              No results found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ComboBoxOnFire;
