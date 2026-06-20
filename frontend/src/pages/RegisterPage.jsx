import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api.js";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      setSuccess(data.message);
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      // note: this is where the DB-level uniqueness error surfaces to the user
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, marginTop: "8vh" }}>
      <h1 className="h4 mb-4 text-center">Create an account</h1>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Full name</label>
          <input className="form-control" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">E-mail</label>
          <input type="email" className="form-control" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input type="password" className="form-control" required minLength={1} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn btn-primary w-100" disabled={busy} type="submit">
          {busy ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <p className="text-center mt-3 mb-0">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
