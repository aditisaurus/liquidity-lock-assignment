import React from "react";

const Dashboard = ({ user, onLogout }) => {
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
      gridTemplateColumns: "1fr 1fr",
      gap: "30px",
    },
    card: {
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
    cardTitle: {
      marginTop: 0,
      marginBottom: "20px",
      fontSize: "20px",
      fontWeight: "600",
    },
    placeholder: {
      border: "2px dashed #dee2e6",
      height: "400px",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#6c757d",
      textAlign: "center",
      padding: "20px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.userInfo}>
          {user.photoURL && (
            <img src={user.photoURL} alt="Profile" style={styles.avatar} />
          )}
          <div>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={styles.subtitle}>
              Welcome back, {user.displayName || user.email}
            </p>
          </div>
        </div>
        <button onClick={onLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Interactive Graph</h2>
          <div style={styles.placeholder}>
            <div>
              <div style={{ fontSize: "32px", marginBottom: "10px" }}>📈</div>
              <div>
                <strong>Coming in PR #3</strong>
              </div>
              <div style={{ fontSize: "14px", marginTop: "10px" }}>
                • Double-click to create points
                <br />
                • Drag existing points
                <br />• Real-time table sync
              </div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Data Table</h2>
          <div style={styles.placeholder}>
            <div>
              <div style={{ fontSize: "32px", marginBottom: "10px" }}>📊</div>
              <div>
                <strong>Coming in PR #4</strong>
              </div>
              <div style={{ fontSize: "14px", marginTop: "10px" }}>
                • X, Y coordinates display
                <br />
                • Hover highlighting
                <br />• Real-time updates
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
