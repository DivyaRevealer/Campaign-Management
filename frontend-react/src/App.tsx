import React, { ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Import components
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Create_Campaign from "./components/Create_Campaign";
import Run_Campaign from "./components/Run_Campaign";
import Layout from "./components/Layout";
import Campaign_Summary from "./components/Campaign_Summary";
import Campaign_Dashboard from "./components/Campaign_Dashboard";
import TemplateCreation from "./components/TemplateCreation";

// ---------- Auth Helper ----------
const isAuthenticated = (): boolean => !!localStorage.getItem("token");

// ---------- PrivateRoute ----------
interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
};

// ---------- App Component ----------
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Login Page */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* Protected Campaign Dashboard */}
        <Route
          path="/campaign-dashboard"
          element={
            <PrivateRoute>
              <Layout>
                <Campaign_Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* Protected Create Campaign */}
        <Route
          path="/create-campaign"
          element={
            <PrivateRoute>
              <Layout>
                <Create_Campaign />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* Protected Campaign Summary */}
        <Route
          path="/campaign-summary"
          element={
            <PrivateRoute>
              <Layout>
                <Campaign_Summary />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* Protected Run Campaign */}
        <Route
          path="/run-campaign"
          element={
            <PrivateRoute>
              <Layout>
                <Run_Campaign />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* Protected Template Creation */}
        <Route
          path="/template"
          element={
            <PrivateRoute>
              <Layout>
                <TemplateCreation />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
