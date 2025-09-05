const DashboardHeader = ({
  user,
  onClearAll,
  onLogout,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  return (
    <header className="flex items-center justify-between p-6 mb-8 border border-gray-200 shadow-md rounded-2xl bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100">
      {/* Left: Profile + Title */}
      <div className="flex items-center gap-4">
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt="Profile"
            className="object-cover w-12 h-12 border border-gray-300 rounded-full shadow-sm"
          />
        ) : (
          <div className="flex items-center justify-center w-12 h-12 text-lg font-semibold text-gray-700 bg-gray-200 rounded-full">
            {user?.displayName?.charAt(0) || "U"}
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
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
          onClick={onUndo}
          disabled={!canUndo}
          className="px-4 py-2 text-sm font-medium text-gray-700 transition bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="px-4 py-2 text-sm font-medium text-gray-700 transition bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          Redo
        </button>

        <button
          onClick={onClearAll}
          className="px-4 py-2 text-sm font-medium transition rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200"
        >
          Clear Points
        </button>

        <button
          onClick={onLogout}
          className="px-4 py-2 text-sm font-medium text-white transition bg-red-500 rounded-lg hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
