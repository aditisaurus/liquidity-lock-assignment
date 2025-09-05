// src/components/Dashboard/Dashboard.jsx
import React, { useState, useCallback, useEffect, useMemo } from "react";
import DataTable from "../Table/DataTable";
import Graph from "../graph/Graph";
import EditPointDialog from "../dialog/EditPointDialog";

const STORAGE_NS = "igd:points:v1";
const getKey = (user) => `${STORAGE_NS}:${user?.uid || "anon"}`;

const SAMPLE = [
  { id: "1", x: 10, y: 20 },
  { id: "2", x: 25, y: 35 },
  { id: "3", x: 40, y: 45 },
  { id: "4", x: 55, y: 30 },
  { id: "5", x: 70, y: 60 },
];

const safeParse = (raw) => {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
};

const Dashboard = ({ user, onLogout }) => {
  // Load initial points from localStorage (per user), else fall back to SAMPLE
  const [points, setPoints] = useState(() => {
    if (typeof window === "undefined") return SAMPLE;
    const saved = safeParse(localStorage.getItem(getKey(user)));
    return saved ?? SAMPLE;
  });

  const storageKey = useMemo(() => getKey(user), [user?.uid]);

  const [editingPoint, setEditingPoint] = useState(null);
  const [highlightedPoint, setHighlightedPoint] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
  });

  // Persist whenever points change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(points));
    } catch {}
  }, [points, storageKey]);

  // When the user changes (different storageKey), load their saved points or SAMPLE
  useEffect(() => {
    const saved = safeParse(localStorage.getItem(storageKey));
    setPoints(saved ?? SAMPLE);
  }, [storageKey]);

  // Optional: keep multiple tabs/windows in sync
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

  const showNotification = (message) => {
    setNotification({ show: true, message });
    setTimeout(() => setNotification({ show: false, message: "" }), 3000);
  };

  const handlePointsChange = useCallback(
    (newPoints) => setPoints(newPoints),
    []
  );

  // Open editor (from table or graph)
  const handlePointEdit = useCallback((point) => {
    setEditingPoint(point);
    setHighlightedPoint(point?.id ?? null);
  }, []);

  // Live updates from popup while typing
  const handleDialogLiveChange = useCallback((updated) => {
    setPoints((prev) =>
      prev.map((p) =>
        p.id === updated.id ? { ...p, x: updated.x, y: updated.y } : p
      )
    );
    setHighlightedPoint(updated.id);
  }, []);

  // Save from popup
  const handlePointSave = useCallback((updatedPoint) => {
    setPoints((prev) =>
      prev.map((p) => (p.id === updatedPoint.id ? updatedPoint : p))
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
      setPoints([]);
      setHighlightedPoint(null);
      setEditingPoint(null);
      showNotification("All points cleared");
    }
  };

  const styles = {
    container: {
      padding: "20px",
      fontFamily: "Arial, sans-serif",
      backgroundColor: "#f8f9fa",
      minHeight: "100vh",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "30px",
      padding: "20px",
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
    userInfo: { display: "flex", alignItems: "center", gap: "15px" },
    avatar: { width: "50px", height: "50px", borderRadius: "50%" },
    title: { margin: 0, fontSize: "24px", fontWeight: "bold" },
    subtitle: { margin: 0, color: "#666", fontSize: "14px" },
    headerButtons: { display: "flex", gap: "10px" },
    clearButton: {
      padding: "10px 20px",
      backgroundColor: "#6c757d",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "500",
    },
    logoutButton: {
      padding: "10px 20px",
      backgroundColor: "#dc3545",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "500",
    },
    grid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "30px" },
    card: {
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      height: "600px",
      display: "flex",
      flexDirection: "column",
    },
    cardTitle: {
      marginTop: 0,
      marginBottom: "20px",
      fontSize: "20px",
      fontWeight: "600",
    },
    graphContainer: {
      flex: 1,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    tableContainer: { flex: 1, overflow: "auto" },
    notification: {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      padding: "12px 20px",
      backgroundColor: "#28a745",
      color: "white",
      borderRadius: "8px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      zIndex: 1000,
      animation: "slideIn 0.3s ease-out",
    },
    pointsCounter: {
      marginTop: "10px",
      padding: "8px",
      backgroundColor: "#e9ecef",
      borderRadius: "4px",
      fontSize: "14px",
      textAlign: "center",
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.userInfo}>
          {user?.photoURL && (
            <img src={user.photoURL} alt="Profile" style={styles.avatar} />
          )}
          <div>
            <h1 style={styles.title}>Interactive Graph Dashboard</h1>
            <p style={styles.subtitle}>
              Welcome back, {user?.displayName || user?.email}
            </p>
          </div>
        </div>
        <div style={styles.headerButtons}>
          <button onClick={handleClearAll} style={styles.clearButton}>
            Clear All Points
          </button>
          <button onClick={onLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={styles.grid}>
        {/* Graph Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Interactive Graph</h2>
          <div style={styles.graphContainer}>
            <Graph
              points={points}
              onPointsChange={handlePointsChange}
              highlightedPoint={highlightedPoint}
              onPointHover={handlePointHover}
              onPointClick={handlePointEdit}
              width={700}
              height={500}
              // Optional extras:
              // scaleMode="auto"
              // zoomScaleExtent={[0.5, 40]}
            />
          </div>
        </div>

        {/* Table Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Data Table</h2>
          <div style={styles.tableContainer}>
            <DataTable
              points={points}
              onPointEdit={handlePointEdit}
              onPointDelete={handlePointDelete}
              highlightedPoint={highlightedPoint}
              onRowHover={handlePointHover}
              // numberFormatter={...} // optional override for display/tooltip formatting
            />
          </div>
          <div style={styles.pointsCounter}>Total Points: {points.length}</div>
        </div>
      </div>

      {/* Popup Editor (live updates enabled) */}
      <EditPointDialog
        open={!!editingPoint}
        point={editingPoint}
        onClose={handleEditDialogClose}
        onSave={handlePointSave}
        onLiveChange={handleDialogLiveChange}
        // bounds={{minX:-1e9,maxX:1e9,minY:-1e9,maxY:1e9}} // optional hint/limits
        // enforceBounds={false}
      />

      {/* Notification */}
      {notification.show && (
        <div style={styles.notification}>{notification.message}</div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
