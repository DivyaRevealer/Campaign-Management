import React, { useState, ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  FaBars,
  FaBullseye,
  FaSignOutAlt,
  FaPlusCircle,
  FaPlayCircle,
  FaChartBar,
  FaFileAlt,
} from "react-icons/fa";
import "./Layout.css";

interface LayoutProps {
  children?: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState<boolean>(true);

  const toggleSidebar = () => setCollapsed((prev) => !prev);

  const handleLogout = (): void => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className={`layout ${collapsed ? "collapsed" : ""}`}>
      <aside
        className="sidebar"
        style={{
          background: "linear-gradient(180deg, #00E0D3 0%, #00B4DB 100%)",
          color: "#fff",
        }}
      >
        {/* Collapse / Expand */}
        <button
          className="toggle-btn"
          onClick={toggleSidebar}
          title={collapsed ? "Expand" : "Collapse"}
        >
          <FaBars />
        </button>

        {/* Navigation Icons */}
        <Link to="/dashboard" className="nav-btn" title="Dashboard">
          <FaBullseye />
        </Link>

        <Link to="/campaign-dashboard" className="nav-btn" title="Campaign Dashboard">
          <FaChartBar />
        </Link>

        <Link to="/createcampaign" className="nav-btn" title="Create Campaign">
          <FaPlusCircle />
        </Link>

        <Link to="/runcampaign" className="nav-btn" title="Run Campaign">
          <FaPlayCircle />
        </Link>

        <Link to="/template" className="nav-btn" title="Template Creation">
          <FaFileAlt />
        </Link>

        {/* Logout */}
        <button className="nav-btn" onClick={handleLogout} title="Logout">
          <FaSignOutAlt />
        </button>
      </aside>

      {/* Main Content Wrapper */}
      <div className="main">
        <header className="header">Target Achievement Analysis</header>
        <div className="content">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
