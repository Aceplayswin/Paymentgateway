import { useNavigate } from "react-router-dom";

function Dashboard({ onLogout }) {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("paygate_auth");
    onLogout();
    navigate("/login");
  };

  return (
    <main className="dashboard-page">
      <div className="bg-shape shape-1" />
      <div className="bg-shape shape-2" />
      <div className="bg-shape shape-3" />

      <section className="dashboard-card">
        <h1>Welcome to Payment Gateway Dashboard</h1>
        <p>Your merchant control center is ready.</p>
        <button type="button" className="primary-btn logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </section>
    </main>
  );
}

export default Dashboard;
