// src/components/Dashboard/DashboardHeader.jsx
import React from "react";

const DashboardHeader = ({ user, onClearAll, onLogout }) => {
  return (
    <header className="mb-8 flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 p-6 shadow-md border border-gray-200">
      {/* Left: Profile + Title */}
      <div className="flex items-center gap-4">
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt="Profile"
            className="h-12 w-12 rounded-full border border-gray-300 shadow-sm object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-700">
            {user?.displayName?.charAt(0) || "U"}
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Interactive Graph Dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Welcome back, {user?.displayName || user?.email}
          </p>
        </div>
      </div>

      {/* Right: Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={onClearAll}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
        >
          Clear Points
        </button>
        <button
          onClick={onLogout}
          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
