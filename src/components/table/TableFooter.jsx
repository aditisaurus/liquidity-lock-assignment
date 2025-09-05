// src/components/Table/TableFooter.jsx
import React from "react";

const TableFooter = ({ points, onExportJSON, onExportCSV }) => {
  if (!points || points.length === 0) return null;

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm border-t border-gray-200 bg-gray-50">
      <div className="flex gap-2">
        <button
          onClick={onExportJSON}
          className="px-3 py-1 text-xs font-medium text-blue-600 transition border border-blue-500 rounded-md hover:bg-blue-50"
        >
          Export JSON
        </button>
        <button
          onClick={onExportCSV}
          className="px-3 py-1 text-xs font-medium text-green-600 transition border border-green-500 rounded-md hover:bg-green-50"
        >
          Export CSV
        </button>
      </div>
    </div>
  );
};

export default TableFooter;
