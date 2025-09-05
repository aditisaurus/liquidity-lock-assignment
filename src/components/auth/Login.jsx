const Login = ({ onLogin, loading }) => {
  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
      fontFamily: "Arial, sans-serif",
    },
    card: {
      backgroundColor: "white",
      padding: "40px",
      borderRadius: "20px",
      textAlign: "center",
      maxWidth: "400px",
      width: "100%",
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      marginBottom: "10px",
      color: "#333",
    },
    description: {
      color: "#666",
      marginBottom: "30px",
      lineHeight: "1.5",
    },
    button: {
      padding: "15px 30px",
      backgroundColor: loading ? "#ccc" : "#4285f4",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: loading ? "not-allowed" : "pointer",
      fontSize: "16px",
      width: "100%",
      transition: "background-color 0.3s",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Interactive Graph Dashboard</h1>
        <p style={styles.description}>
          Sign in to access your personalized dashboard with interactive graphs
          and real-time data tables
        </p>
        <button onClick={onLogin} style={styles.button} disabled={loading}>
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>
      </div>
    </div>
  );
};

export default Login;
