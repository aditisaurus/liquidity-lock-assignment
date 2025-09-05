import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { signInWithGoogle, logout, auth } from "./utils/firebase";
import Login from "./components/auth/Login";
import Dashboard from "./components/dashboard/Dashboard";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = () => signInWithGoogle();
  const handleLogout = () => logout();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontFamily: "Arial, sans-serif",
        }}
      >
        Loading...
      </div>
    );
  }

  return user ? (
    <Dashboard user={user} onLogout={handleLogout} />
  ) : (
    <Login onLogin={handleLogin} loading={false} />
  );
}

export default App;
