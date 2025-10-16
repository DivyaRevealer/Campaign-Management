import React, { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios, { AxiosResponse } from "axios";
import "./Login.css";

interface LoginResponse {
  access_token: string;
}

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");

    try {
      const response: AxiosResponse<LoginResponse> = await axios.post("/api/login", {
        username,
        password,
      });

      localStorage.setItem("token", response.data.access_token);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      setError("Invalid username or password");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-header">Welcome Back</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="login-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
          />
          <button type="submit" className="login-button">
            Sign In
          </button>
          {error && <p className="login-error">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Login;
