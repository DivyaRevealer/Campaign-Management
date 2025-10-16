
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import UploadForm from "./components/UploadForm";
import RFMTable from "./components/RFMTable";
import SegmentChart from "./components/SegmentChart";

const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

function Dashboard() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>RFM Analysis Tool</h1>
      <UploadForm />
      <SegmentChart />
      <RFMTable />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
