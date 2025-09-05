// src/components/Dashboard/Dashboard.jsx
import React, { useState, useCallback, useEffect } from "react";
import DataTable from "../Table/DataTable";
import Graph from "../graph/Graph";
import EditPointDialog from "../dialog/EditPointDialog";

const Dashboard = ({ user, onLogout }) => {
  // State management for points and UI
  const [points, setPoints] = useState([]);
  const [editingPoint, setEditingPoint] = useState(null);
  const [highlightedPoint, setHighlightedPoint] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
  });

  // Initialize with sample data
  useEffect(() => {
    const samplePoints = [
      { id: "1", x: 10, y: 20 },
      { id: "2", x: 25, y: 35 },
      { id: "3", x: 40, y: 45 },
      { id: "4", x: 55, y: 30 },
      { id: "5", x: 70, y: 60 },
    ];
    setPoints(samplePoints);
  }, []);

  // Show notification
  const showNotification = (message) => {
    setNotification({ show: true, message });
    setTimeout(() => setNotification({ show: false, message: "" }), 3000);
  };

  // Handle points change from graph
  const handlePointsChange = useCallback((newPoints) => {
    setPoints(newPoints);
  }, []);

  // Handle point edit from table
  const handlePointEdit = useCallback((point) => {
    setEditingPoint(point);
  }, []);

  // Handle point save from dialog
  const handlePointSave = useCallback((updatedPoint) => {
    setPoints((prevPoints) =>
      prevPoints.map((point) =>
        point.id === updatedPoint.id ? updatedPoint : point
      )
    );
    showNotification("Point updated successfully");
  }, []);

  // Handle point delete from table
  const handlePointDelete = useCallback(
    (pointId) => {
      setPoints((prevPoints) =>
        prevPoints.filter((point) => point.id !== pointId)
      );
      showNotification("Point deleted successfully");
      if (highlightedPoint === pointId) {
        setHighlightedPoint(null);
      }
    },
    [highlightedPoint]
  );

  // Handle dialog close
  const handleEditDialogClose = useCallback(() => {
    setEditingPoint(null);
  }, []);

  // Handle hover events
  const handlePointHover = useCallback((pointId) => {
    setHighlightedPoint(pointId);
  }, []);

  // Handle point click from graph
  const handlePointClick = useCallback((point) => {
    setEditingPoint(point);
  }, []);

  // Handle clear all points
  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all points?")) {
      setPoints([]);
      showNotification("All points cleared");
    }
  };

  // Styles
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
    userInfo: {
      display: "flex",
      alignItems: "center",
      gap: "15px",
    },
    avatar: {
      width: "50px",
      height: "50px",
      borderRadius: "50%",
    },
    title: {
      margin: 0,
      fontSize: "24px",
      fontWeight: "bold",
    },
    subtitle: {
      margin: 0,
      color: "#666",
      fontSize: "14px",
    },
    headerButtons: {
      display: "flex",
      gap: "10px",
    },
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
    grid: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr",
      gap: "30px",
    },
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
    tableContainer: {
      flex: 1,
      overflow: "auto",
    },
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
    "@keyframes slideIn": {
      from: {
        transform: "translateX(100%)",
        opacity: 0,
      },
      to: {
        transform: "translateX(0)",
        opacity: 1,
      },
    },
  };

  // Add responsive styles for mobile
  const mobileStyles = {
    "@media (max-width: 768px)": {
      grid: {
        gridTemplateColumns: "1fr",
      },
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.userInfo}>
          {user.photoURL && (
            <img src={user.photoURL} alt="Profile" style={styles.avatar} />
          )}
          <div>
            <h1 style={styles.title}>Interactive Graph Dashboard</h1>
            <p style={styles.subtitle}>
              Welcome back, {user.displayName || user.email}
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
              onPointClick={handlePointClick}
              width={700}
              height={500}
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
            />
          </div>
          <div style={styles.pointsCounter}>Total Points: {points.length}</div>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditPointDialog
        open={!!editingPoint}
        point={editingPoint}
        onClose={handleEditDialogClose}
        onSave={handlePointSave}
      />

      {/* Notification */}
      {notification.show && (
        <div style={styles.notification}>{notification.message}</div>
      )}

      {/* Add keyframes style to document */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
