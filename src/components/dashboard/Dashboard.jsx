import { useState, useCallback, useEffect, useMemo } from "react";
import DataTable from "../Table/DataTable";
import Graph from "../Graph/Graph";
import EditPointDialog from "../dialog/EditPointDialog";
import DashboardHeader from "./DashboardHeader";
import { Typography } from "@mui/material";

import { SAMPLE_POINTS } from "./utils/constants";
import { getKey, safeParse } from "./utils/storage";

// helper to sanitize numbers
const sanitizeNumber = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

const Dashboard = ({ user, onLogout }) => {
  const storageKey = useMemo(() => getKey(user), [user?.uid]);

  // ----------------------
  // State
  // ----------------------
  const [points, setPoints] = useState(() => {
    if (typeof window === "undefined") return SAMPLE_POINTS;
    const saved = safeParse(localStorage.getItem(storageKey));
    return saved ?? SAMPLE_POINTS;
  });

  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  const [editingPoint, setEditingPoint] = useState(null);
  const [highlightedPoint, setHighlightedPoint] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
  });

  // ----------------------
  // Effects
  // ----------------------
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(points));
    } catch {}
  }, [points, storageKey]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === storageKey) {
        const saved = safeParse(e.newValue);
        if (saved) setPoints(saved);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey]);

  // ----------------------
  // Handlers
  // ----------------------
  const showNotification = (message) => {
    setNotification({ show: true, message });
    setTimeout(() => setNotification({ show: false, message: "" }), 3000);
  };

  const handlePointsChange = useCallback(
    (newPoints) => {
      setHistory((prev) => [...prev, points]); // push current state
      setFuture([]); // clear redo stack
      setPoints(
        newPoints.map((p) => ({
          ...p,
          x: sanitizeNumber(p.x),
          y: sanitizeNumber(p.y),
        }))
      );
    },
    [points]
  );

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture((f) => [points, ...f]);
    setHistory((h) => h.slice(0, -1));
    setPoints(prev);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((h) => [...h, points]);
    setFuture((f) => f.slice(1));
    setPoints(next);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(points, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "points.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csv = ["id,x,y", ...points.map((p) => `${p.id},${p.x},${p.y}`)].join(
      "\n"
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "points.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePointEdit = useCallback((point) => {
    setEditingPoint(point);
    setHighlightedPoint(point?.id ?? null);
  }, []);

  const handleDialogLiveChange = useCallback((updated) => {
    setPoints((prev) =>
      prev.map((p) =>
        p.id === updated.id
          ? { ...p, x: sanitizeNumber(updated.x), y: sanitizeNumber(updated.y) }
          : p
      )
    );
    setHighlightedPoint(updated.id);
  }, []);

  const handlePointSave = useCallback((updatedPoint) => {
    setPoints((prev) =>
      prev.map((p) =>
        p.id === updatedPoint.id
          ? {
              ...updatedPoint,
              x: sanitizeNumber(updatedPoint.x),
              y: sanitizeNumber(updatedPoint.y),
            }
          : p
      )
    );
    showNotification("Point updated successfully");
  }, []);

  const handlePointDelete = useCallback(
    (pointId) => {
      setPoints((prev) => prev.filter((p) => p.id !== pointId));
      if (highlightedPoint === pointId) setHighlightedPoint(null);
      if (editingPoint?.id === pointId) setEditingPoint(null);
      showNotification("Point deleted successfully");
    },
    [highlightedPoint, editingPoint]
  );

  const handleEditDialogClose = useCallback(() => setEditingPoint(null), []);
  const handlePointHover = useCallback(
    (pointId) => setHighlightedPoint(pointId),
    []
  );
  const handlePointClick = useCallback(
    (point) => handlePointEdit(point),
    [handlePointEdit]
  );

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all points?")) {
      setHistory((prev) => [...prev, points]); // save before clearing
      setFuture([]);
      setPoints([]);
      setHighlightedPoint(null);
      setEditingPoint(null);
      showNotification("All points cleared");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      onLogout();
    }
  };

  // ----------------------
  // Render
  // ----------------------
  return (
    <div className="min-h-screen p-5 font-sans bg-gray-100">
      {/* Header */}
      <DashboardHeader
        user={user}
        onClearAll={handleClearAll}
        onLogout={handleLogout}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-[2fr_1fr] gap-8">
        {/* Graph Card */}
        <div className="flex h-[600px] flex-col rounded-2xl bg-white p-6 shadow-lg">
          <div className="p-4 rounded-t-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
            <strong className="block text-lg font-semibold">
              Interactive Graph
            </strong>

            <Typography variant="caption" color="text.secondary" align="center">
              Scroll to zoom • Drag to pan • Double-click/tap to add • Drag
              points to move
            </Typography>
          </div>

          <div className="flex-1 overflow-hidden">
            <Graph
              points={points}
              onPointsChange={handlePointsChange}
              highlightedPoint={highlightedPoint}
              onPointHover={handlePointHover}
              onPointClick={handlePointEdit}
            />
          </div>
        </div>

        {/* Table Card */}
        <div className="flex h-[600px] flex-col rounded-2xl bg-white p-6 shadow-lg">
          <div className="p-4 rounded-t-2xl bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 ">
            <Typography variant="h6">Data Points Table</Typography>

            <Typography variant="caption" color="text.secondary">
              Hover to highlight • Click edit to modify coordinates
            </Typography>
          </div>

          <div className="flex-1 overflow-auto">
            <DataTable
              points={points}
              onPointEdit={handlePointEdit}
              onPointDelete={handlePointDelete}
              highlightedPoint={highlightedPoint}
              onRowHover={handlePointHover}
              onExportJSON={handleExportJSON}
              onExportCSV={handleExportCSV}
            />
          </div>

          <div className="p-2 mt-3 text-sm text-center text-gray-600 border border-gray-200 rounded-lg bg-gray-50">
            Total Points: {points.length}
          </div>
        </div>
      </div>

      {/* Popup Editor */}
      <EditPointDialog
        open={!!editingPoint}
        point={editingPoint}
        onClose={handleEditDialogClose}
        onSave={handlePointSave}
        onLiveChange={handleDialogLiveChange}
      />

      {/* Notification */}
      {notification.show && (
        <div className="fixed z-50 px-5 py-3 text-white bg-green-600 rounded-lg shadow-lg bottom-5 right-5 animate-slideIn">
          {notification.message}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
