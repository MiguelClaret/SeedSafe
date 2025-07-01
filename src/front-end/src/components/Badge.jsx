import React from "react";

const baseClasses =
  "px-3 py-1 rounded-full text-sm font-medium border transition-colors cursor-pointer select-none";

export default function Badge({ label, selected, onToggle }) {
  const classes = selected
    ? `${baseClasses} bg-green-600 text-white border-green-700`
    : `${baseClasses} bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200`;

  return (
    <span
      className={classes}
      onClick={() => onToggle && onToggle(!selected)}
    >
      {label}
    </span>
  );
} 