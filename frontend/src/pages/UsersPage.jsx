import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

// note: helper to build a stable React key / DOM id for each row
function getUniqIdValue(user) {
  return `user-row-${user.id}`;
}

function formatLastLogin(value) {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
}

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [status, setStatus] = useState(null); // { type: 'success'|'danger', text }
  const [sortDir, setSortDir] = useState("desc"); // user-adjustable sort, per requirement
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    try {
      const { data } = await api.get("/users");
      setUsers(data);
      setSelected(new Set()); // note: reset selection on reload, stale ids would be confusing
    } catch (err) {
      // important: the axios interceptor already redirects on auth errors;
      // anything else lands here
      setStatus({ type: "danger", text: "Could not load users." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const sortedUsers = useMemo(() => {
    const copy = [...users];
    copy.sort((a, b) => {
      const av = a.last_login ? new Date(a.last_login).getTime() : 0;
      const bv = b.last_login ? new Date(b.last_login).getTime() : 0;
      return sortDir === "desc" ? bv - av : av - bv;
    });
    return copy;
  }, [users, sortDir]);

  const allSelected = sortedUsers.length > 0 && selected.size === sortedUsers.length;
  const anySelected = selected.size > 0;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(sortedUsers.map((u) => u.id)));
  }

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function runAction(actionFn, successText) {
    setStatus(null);
    try {
      const ids = Array.from(selected);
      const { data } = await actionFn(ids);
      setStatus({ type: "success", text: data.message || successText });

      const currentUserId = getCurrentUserId();
      // important: if the action affected the current user, the next request
      // they make (i.e. reloading the list) will be redirected by the auth
      // middleware automatically — we don't special-case it here beyond reload.
      await loadUsers();
      if (data.selfBlocked || data.selfDeleted) {
        // note: trigger an immediate re-check so the redirect happens right away,
        // matching "all user blocking (with automatic redirection to login page)"
        await api.get("/users");
      }
    } catch (err) {
      setStatus({ type: "danger", text: err.response?.data?.message || "Action failed." });
    }
  }

  function getCurrentUserId() {
    try {
      const token = localStorage.getItem("token");
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id;
    } catch {
      return null;
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  const hasBlockedSelected = sortedUsers.some((u) => selected.has(u.id) && u.status === "blocked");
  const hasActiveSelected = sortedUsers.some((u) => selected.has(u.id) && u.status !== "blocked");

  return (
    <div className="container py-4">
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h5 mb-0">User management</h1>
        <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>
          Log out
        </button>
      </header>

      {status && (
        <div className={`alert alert-${status.type}`} role="alert">
          {status.text}
        </div>
      )}

      {/* important: toolbar is always visible, only enabled/disabled state changes */}
      <div className="d-flex gap-2 mb-3 align-items-center border rounded p-2 bg-light">
        <button
          className="btn btn-outline-primary btn-sm"
          disabled={!anySelected || !hasActiveSelected}
          title="Block selected users"
          onClick={() => runAction((ids) => api.post("/users/block", { ids }), "Users blocked.")}
        >
          Block
        </button>
        <button
          className="btn btn-outline-secondary btn-sm"
          disabled={!anySelected || !hasBlockedSelected}
          title="Unblock selected users"
          onClick={() => runAction((ids) => api.post("/users/unblock", { ids }), "Users unblocked.")}
        >
          ⟳ Unblock
        </button>
        <button
          className="btn btn-outline-danger btn-sm"
          disabled={!anySelected}
          title="Delete selected users"
          onClick={() => {
            if (window.confirm("Delete selected users? This cannot be undone.")) {
              runAction((ids) => api.post("/users/delete", { ids }), "Users deleted.");
            }
          }}
        >
          🗑 Delete
        </button>
        <button
          className="btn btn-outline-warning btn-sm"
          title="Delete all unverified users"
          onClick={() => {
            if (window.confirm("Delete all unverified users?")) {
              runAction(() => api.post("/users/delete-unverified"), "Unverified users deleted.");
            }
          }}
        >
          ✦ Delete unverified
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="table table-hover align-middle">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input type="checkbox" className="form-check-input" checked={allSelected} onChange={toggleAll} />
              </th>
              <th>Name</th>
              <th>E-mail</th>
              <th
                role="button"
                onClick={() => setSortDir(sortDir === "desc" ? "asc" : "desc")}
                title="Click to change sort order"
              >
                Last login {sortDir === "desc" ? "↓" : "↑"}
              </th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((u) => (
              <tr key={getUniqIdValue(u)}>
                <td>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selected.has(u.id)}
                    onChange={() => toggleOne(u.id)}
                  />
                </td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{formatLastLogin(u.last_login)}</td>
                <td>
                  <span
                    className={`badge ${
                      u.status === "active" ? "bg-success" : u.status === "blocked" ? "bg-danger" : "bg-secondary"
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
            {sortedUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted py-4">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
