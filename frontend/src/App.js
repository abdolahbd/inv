import React, { useState, useEffect, useMemo, useCallback } from "react";

const API = "";
const GOOGLE_CLIENT_ID = "321882385705-dvfkpv8ej4ib7pedtcgg9oism8p911uj.apps.googleusercontent.com";

const getHeaders = (token, isJson = true) => {
  const headers = { "ngrok-skip-browser-warning": "true" };
  if (isJson) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

const styles = {
  appContainer: { display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: "#f8fafc", color: "#334155" },
  sidebar: { width: "260px", backgroundColor: "#1e293b", color: "#f8fafc", display: "flex", flexDirection: "column", padding: "20px 0" },
  sidebarTitle: { padding: "0 20px", fontSize: "20px", fontWeight: "bold", marginBottom: "30px", letterSpacing: "1px", color: "#60a5fa" },
  navItem: { padding: "15px 20px", cursor: "pointer", fontSize: "16px", transition: "0.2s", display: "flex", alignItems: "center" },
  navItemActive: { padding: "15px 20px", cursor: "pointer", fontSize: "16px", backgroundColor: "#3b82f6", color: "#fff", fontWeight: "bold", borderRight: "4px solid #bfdbfe" },
  mainContent: { flex: 1, padding: "40px", overflowY: "auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", paddingBottom: "15px", borderBottom: "1px solid #e2e8f0" },
  card: { backgroundColor: "#fff", padding: "25px", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", marginBottom: "25px" },
  cardTitle: { marginTop: 0, marginBottom: "20px", color: "#0f172a", fontSize: "18px" },
  input: { width: "100%", padding: "10px", marginBottom: "15px", border: "1px solid #cbd5e1", borderRadius: "5px", boxSizing: "border-box", fontSize: "14px" },
  button: { backgroundColor: "#3b82f6", color: "#fff", padding: "10px 15px", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", marginRight: "10px" },
  buttonSecondary: { backgroundColor: "#64748b", color: "#fff", padding: "10px 15px", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", marginRight: "10px" },
  buttonSuccess: { backgroundColor: "#10b981", color: "#fff", padding: "10px 15px", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "14px", fontWeight: "bold" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: "15px", fontSize: "14px" },
  th: { padding: "12px", textAlign: "left", backgroundColor: "#f1f5f9", borderBottom: "2px solid #cbd5e1", color: "#334155" },
  td: { padding: "12px", borderBottom: "1px solid #e2e8f0", color: "#475569" },
  badge: { padding: "5px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" },
  statBoxContainer: { display: "flex", gap: "20px", flexWrap: "wrap" },
  statBox: { flex: "1", backgroundColor: "#f1f5f9", padding: "20px", borderRadius: "8px", textAlign: "center", minWidth: "200px" },
  statNumber: { fontSize: "32px", fontWeight: "bold", color: "#3b82f6", margin: "10px 0" },
  authContainer: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f8fafc" },
  authCard: { backgroundColor: "#fff", padding: "40px", borderRadius: "10px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", width: "100%", maxWidth: "400px" },
};

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("workspaces");
  const [history, setHistory] = useState([]);

  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  const [files, setFiles] = useState([]);
  const [fields, setFields] = useState("");
  const [columnsMode, setColumnsMode] = useState("auto");
  const [loading, setLoading] = useState(false);

  const [jobs, setJobs] = useState([]);
  const [activeJobId, setActiveJobId] = useState("");

  const [accEmail, setAccEmail] = useState("");
  const [accPassword, setAccPassword] = useState("");
  const [accLang, setAccLang] = useState("English");

  const selectedWorkspace = useMemo(() => workspaces.find((w) => w.id === selectedWorkspaceId), [workspaces, selectedWorkspaceId]);
  const activeJob = useMemo(() => jobs.find((j) => j.id === activeJobId) || jobs[0], [jobs, activeJobId]);
  const resultRows = useMemo(() => {
    if (!activeJob?.result_json) return [];
    if (Array.isArray(activeJob.result_json)) return activeJob.result_json;
    try {
      return JSON.parse(activeJob.result_json);
    } catch {
      return [];
    }
  }, [activeJob]);

  const refreshUser = useCallback(() => {
    if (!token) return;
    fetch(`${API}/api/me`, { headers: getHeaders(token, false) })
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) logout();
        else {
          setUser(json.user);
          setAccEmail(json.user.email);
        }
      })
      .catch(() => {});
  }, [token]);

  const fetchWorkspaces = useCallback(async () => {
    if (!token) return;
    const res = await fetch(`${API}/api/workspaces`, { headers: getHeaders(token, false) });
    const json = await res.json();
    if (!json.success) return;
    setWorkspaces(json.workspaces || []);
    if (!selectedWorkspaceId && json.workspaces?.length) setSelectedWorkspaceId(json.workspaces[0].id);
  }, [token, selectedWorkspaceId]);

  const fetchWorkspaceJobs = useCallback(async (workspaceId) => {
    if (!token || !workspaceId) return;
    const res = await fetch(`${API}/api/workspaces/${workspaceId}/jobs`, { headers: getHeaders(token, false) });
    const json = await res.json();
    if (!json.success) return;
    setJobs(json.jobs || []);
    if (!activeJobId && json.jobs?.length) setActiveJobId(json.jobs[0].id);
  }, [token, activeJobId]);

  useEffect(() => {
    if (token) {
      refreshUser();
      fetchWorkspaces().catch(() => {});
    }
  }, [token, refreshUser, fetchWorkspaces]);

  useEffect(() => {
    if (activeTab === "workspaces" && selectedWorkspaceId) {
      fetchWorkspaceJobs(selectedWorkspaceId).catch(() => {});
    }
  }, [activeTab, selectedWorkspaceId, fetchWorkspaceJobs]);

  useEffect(() => {
    if (!selectedWorkspaceId) return;
    const timer = setInterval(() => {
      fetchWorkspaceJobs(selectedWorkspaceId).catch(() => {});
    }, 2500);
    return () => clearInterval(timer);
  }, [selectedWorkspaceId, fetchWorkspaceJobs]);

  useEffect(() => {
    if (!token) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      window.handleCredentialResponse = async (response) => {
        try {
          const res = await fetch(`${API}/api/auth/google`, {
            method: "POST",
            headers: getHeaders(null, true),
            body: JSON.stringify({ token: response.credential }),
          });
          const json = await res.json();
          if (json.success) {
            setToken(json.token);
            localStorage.setItem("token", json.token);
          } else {
            alert(json.error || "Google auth failed");
          }
        } catch {
          alert("Network error connecting to backend API.");
        }
      };

      return () => {
        if (document.body.contains(script)) document.body.removeChild(script);
        delete window.handleCredentialResponse;
      };
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === "billing" && token) {
      fetch(`${API}/api/billing/history`, { headers: getHeaders(token, false) })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) setHistory(json.history || []);
        })
        .catch(() => {});
    }
  }, [activeTab, token]);

  const handleManualAuth = async () => {
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: getHeaders(null, true),
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setToken(json.token);
        localStorage.setItem("token", json.token);
      } else {
        alert(json.error || "Authentication failed");
      }
    } catch {
      alert("Network Error: Could not connect to the backend.");
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    setActiveTab("workspaces");
    setWorkspaces([]);
    setSelectedWorkspaceId("");
    setJobs([]);
  };

  const createWorkspace = async () => {
    const name = newWorkspaceName.trim();
    if (!name) return;
    const res = await fetch(`${API}/api/workspaces`, {
      method: "POST",
      headers: getHeaders(token, true),
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (!json.success) return alert(json.error || "Failed to create workspace");
    setNewWorkspaceName("");
    await fetchWorkspaces();
    setSelectedWorkspaceId(json.workspace.id);
  };

  const runExtraction = async () => {
    if (!selectedWorkspaceId) return alert("Please choose a workspace.");
    if (!files.length) return alert("Please select one or many files.");
    if (columnsMode === "manual" && !fields.trim()) return alert("Please define columns for manual mode.");

    setLoading(true);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("files", f));
      form.append("workspace_id", selectedWorkspaceId);
      form.append("columns_mode", columnsMode);
      form.append("fields", JSON.stringify(fields.split(",").map((s) => s.trim()).filter(Boolean)));

      const res = await fetch(`${API}/api/jobs`, {
        method: "POST",
        headers: getHeaders(token, false),
        body: form,
      });

      const json = await res.json();
      if (!json.success) alert(json.error || "Failed to start extraction");
      setFiles([]);
      setFields("");
      await fetchWorkspaceJobs(selectedWorkspaceId);
      refreshUser();
    } catch {
      alert("Network Error during extraction.");
    }
    setLoading(false);
  };

  const exportExcel = async () => {
    if (!activeJob?.id) return;
    try {
      const res = await fetch(`${API}/api/export`, {
        method: "POST",
        headers: getHeaders(token, true),
        body: JSON.stringify({ job_id: activeJob.id }),
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "extraction_data.xlsx";
      a.click();
    } catch {
      alert("Network Error while exporting.");
    }
  };

  const subscribe = async (price) => {
    try {
      const res = await fetch(`${API}/api/create-checkout`, {
        method: "POST",
        headers: getHeaders(token, true),
        body: JSON.stringify({ plan_code: price }),
      });
      const json = await res.json();
      if (json.url) window.location = json.url;
      else alert(json.error);
    } catch {
      alert("Network Error: Could not start checkout.");
    }
  };

  const handleUpdateAccount = () => {
    alert(`Account preferences updated locally!\nEmail: ${accEmail}\nLanguage: ${accLang}\n(Note: Requires backend /api/account/update endpoint to persist)`);
    setAccPassword("");
  };

  if (!token) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authCard}>
          <h2 style={{ textAlign: "center", marginBottom: "30px", color: "#1e293b" }}>ExtractJS SaaS</h2>
          <input type="email" placeholder="Email Address" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} style={styles.input} />
          <input type="password" placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} style={styles.input} />
          <button onClick={handleManualAuth} style={{ ...styles.button, width: "100%", padding: "12px", marginBottom: "15px" }}>
            {isLogin ? "Sign In" : "Create Account"}
          </button>
          <p onClick={() => setIsLogin(!isLogin)} style={{ color: "#3b82f6", cursor: "pointer", textAlign: "center", fontSize: "14px", marginBottom: "25px" }}>
            {isLogin ? "Need an account? Register" : "Already have an account? Login"}
          </p>
          <div style={{ textAlign: "center", borderTop: "1px solid #e2e8f0", paddingTop: "25px" }}>
            <div id="g_id_onload" data-client_id={GOOGLE_CLIENT_ID} data-context="signin" data-ux_mode="popup" data-callback="handleCredentialResponse" data-auto_prompt="false"></div>
            <div className="g_id_signin" data-type="standard" data-shape="rectangular" data-theme="outline" data-text="signin_with" data-size="large" data-logo_alignment="center"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarTitle}>ExtractJS SaaS</div>
        <div style={activeTab === "analytics" ? styles.navItemActive : styles.navItem} onClick={() => setActiveTab("analytics")}>📊 Analytics</div>
        <div style={activeTab === "workspaces" ? styles.navItemActive : styles.navItem} onClick={() => setActiveTab("workspaces")}>📁 Workspaces</div>
        <div style={activeTab === "account" ? styles.navItemActive : styles.navItem} onClick={() => setActiveTab("account")}>⚙️ Account Settings</div>
        <div style={activeTab === "billing" ? styles.navItemActive : styles.navItem} onClick={() => setActiveTab("billing")}>💳 Billing & Plans</div>
        <div style={{ flex: 1 }}></div>
        <div style={{ ...styles.navItem, color: "#f87171" }} onClick={logout}>🚪 Logout</div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.header}>
          <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "14px", color: "#64748b" }}>Logged in as: <strong>{user?.email}</strong></span>
            <span style={{ ...styles.badge, backgroundColor: user?.plan_code === "free" ? "#e2e8f0" : "#dcfce3", color: user?.plan_code === "free" ? "#475569" : "#166534" }}>
              Plan: {user?.plan_code?.toUpperCase()}
            </span>
          </div>
        </div>

        {activeTab === "analytics" && (
          <div style={styles.statBoxContainer}>
            <div style={styles.statBox}><div style={{ color: "#64748b", fontSize: "14px" }}>Total Pages Extracted</div><div style={styles.statNumber}>{user?.usage_pages || 0}</div></div>
            <div style={styles.statBox}><div style={{ color: "#64748b", fontSize: "14px" }}>Storage Used</div><div style={styles.statNumber}>{((user?.storage_used_bytes || 0) / (1024 * 1024)).toFixed(2)} MB</div></div>
            <div style={styles.statBox}><div style={{ color: "#64748b", fontSize: "14px" }}>Active Workspaces</div><div style={styles.statNumber}>{workspaces.length}</div></div>
          </div>
        )}

        {activeTab === "workspaces" && (
          <div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Workspaces</h3>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "15px" }}>
                <select value={selectedWorkspaceId} onChange={(e) => setSelectedWorkspaceId(e.target.value)} style={{ ...styles.input, marginBottom: 0 }}>
                  {workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <input placeholder="New workspace name" value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} style={{ ...styles.input, marginBottom: 0 }} />
                <button onClick={createWorkspace} style={styles.button}>+ Create</button>
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Data Extraction Workspace: {selectedWorkspace?.name || "-"}</h3>
              <label style={{ fontSize: "14px", fontWeight: "bold", display: "block", marginBottom: "5px" }}>1. Select Files (PDF + Images)</label>
              <input type="file" multiple accept=".pdf,image/*" onChange={(e) => setFiles(Array.from(e.target.files || []))} style={styles.input} />

              <label style={{ fontSize: "14px", fontWeight: "bold", display: "block", marginBottom: "5px" }}>2. Define Columns</label>
              <div style={{ display: "flex", gap: "15px", marginBottom: "8px" }}>
                <label><input type="radio" checked={columnsMode === "auto"} onChange={() => setColumnsMode("auto")} /> Automatic (default from first page)</label>
                <label><input type="radio" checked={columnsMode === "manual"} onChange={() => setColumnsMode("manual")} /> Manual</label>
              </div>
              {columnsMode === "manual" && (
                <input placeholder="invoice_number, total_amount, date" value={fields} onChange={(e) => setFields(e.target.value)} style={styles.input} />
              )}

              <button onClick={runExtraction} style={styles.button} disabled={loading}>{loading ? "Starting..." : "▶ Run Extraction"}</button>
            </div>

            {activeJob && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Current Job Progress</h3>
                <p style={{ margin: "5px 0" }}>Status: <strong>{activeJob.status}</strong></p>
                <p style={{ margin: "5px 0" }}>Pages: <strong>{activeJob.processed_pages || 0}</strong> / <strong>{activeJob.total_pages || 0}</strong></p>
                <p style={{ margin: "5px 0" }}>Units: <strong>{activeJob.processed_units || 0}</strong> / <strong>{activeJob.total_units || 0}</strong></p>
                <div style={{ width: "100%", height: "16px", background: "#e2e8f0", borderRadius: "20px", overflow: "hidden", marginTop: "10px" }}>
                  <div style={{ width: `${activeJob.total_units ? Math.round(((activeJob.processed_units || 0) / activeJob.total_units) * 100) : 0}%`, height: "100%", background: "#3b82f6" }}></div>
                </div>
                <p style={{ marginTop: "8px", fontSize: "13px", color: "#64748b" }}>
                  {activeJob.total_units ? Math.round(((activeJob.processed_units || 0) / activeJob.total_units) * 100) : 0}% complete {activeJob.current_item_label ? `• processing ${activeJob.current_item_label}` : ""}
                </p>
                {activeJob.error_text && <p style={{ color: "#b91c1c" }}>Error: {activeJob.error_text}</p>}
                {(activeJob.inferred_fields_json || activeJob.fields_json) && (
                  <p style={{ fontSize: "13px", color: "#475569" }}>Columns used: {typeof (activeJob.inferred_fields_json || activeJob.fields_json) === "string" ? (activeJob.inferred_fields_json || activeJob.fields_json) : JSON.stringify(activeJob.inferred_fields_json || activeJob.fields_json)}</p>
                )}
              </div>
            )}

            {jobs.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Workspace Jobs</h3>
                <table style={styles.table}>
                  <thead><tr><th style={styles.th}>Job</th><th style={styles.th}>Status</th><th style={styles.th}>Progress</th><th style={styles.th}>Created</th></tr></thead>
                  <tbody>
                    {jobs.map((j) => (
                      <tr key={j.id} onClick={() => setActiveJobId(j.id)} style={{ cursor: "pointer", background: activeJob?.id === j.id ? "#eff6ff" : "transparent" }}>
                        <td style={styles.td}>{j.id.slice(0, 8)}...</td>
                        <td style={styles.td}>{j.status}</td>
                        <td style={styles.td}>{j.processed_units || 0}/{j.total_units || 0}</td>
                        <td style={styles.td}>{new Date(j.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {resultRows.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Extraction Results</h3>
                <button onClick={exportExcel} style={styles.buttonSuccess}>📥 Export to Excel</button>
                <div style={{ overflowX: "auto" }}>
                  <table style={styles.table}>
                    <thead><tr>{Object.keys(resultRows[0]).map((k) => <th key={k} style={styles.th}>{k}</th>)}</tr></thead>
                    <tbody>
                      {resultRows.map((row, i) => (
                        <tr key={i}>{Object.values(row).map((v, j) => <td key={j} style={styles.td}>{typeof v === "object" && v !== null ? JSON.stringify(v) : String(v ?? "")}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "account" && (
          <div style={{ maxWidth: "600px" }}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Profile Information</h3>
              <label style={{ fontSize: "14px", fontWeight: "bold", display: "block", marginBottom: "5px" }}>Email Address</label>
              <input type="email" value={accEmail} onChange={(e) => setAccEmail(e.target.value)} style={styles.input} />
              <label style={{ fontSize: "14px", fontWeight: "bold", display: "block", marginBottom: "5px" }}>New Password (leave blank to keep current)</label>
              <input type="password" placeholder="••••••••" value={accPassword} onChange={(e) => setAccPassword(e.target.value)} style={styles.input} />
              <label style={{ fontSize: "14px", fontWeight: "bold", display: "block", marginBottom: "5px" }}>Display Language</label>
              <select value={accLang} onChange={(e) => setAccLang(e.target.value)} style={styles.input}>
                <option value="English">English</option><option value="French">French</option><option value="Spanish">Spanish</option><option value="German">German</option>
              </select>
              <button onClick={handleUpdateAccount} style={styles.button}>Save Changes</button>
            </div>
          </div>
        )}

        {activeTab === "billing" && (
          <div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Upgrade Plan</h3>
              <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px" }}>You are currently on the <strong>{user?.plan_code?.toUpperCase()}</strong> plan.</p>
              <div style={{ display: "flex", gap: "20px" }}>
                <div style={{ ...styles.card, border: "1px solid #cbd5e1", flex: 1, boxShadow: "none" }}>
                  <h4 style={{ margin: "0 0 10px 0" }}>Starter Plan</h4><p style={{ fontSize: "24px", fontWeight: "bold", color: "#0f172a", margin: "0 0 15px 0" }}>$20 /mo</p>
                  <button onClick={() => subscribe("starter")} style={{ ...styles.button, width: "100%" }}>Upgrade to Starter</button>
                </div>
                <div style={{ ...styles.card, border: "2px solid #3b82f6", flex: 1, boxShadow: "none" }}>
                  <h4 style={{ margin: "0 0 10px 0" }}>Business Plan</h4><p style={{ fontSize: "24px", fontWeight: "bold", color: "#0f172a", margin: "0 0 15px 0" }}>$50 /mo</p>
                  <button onClick={() => subscribe("business")} style={{ ...styles.buttonSuccess, width: "100%" }}>Upgrade to Business</button>
                </div>
              </div>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Payment History</h3>
              <table style={styles.table}><thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Amount</th><th style={styles.th}>Status</th><th style={styles.th}>Invoice</th></tr></thead><tbody>
                {history.length === 0 ? <tr><td colSpan="4" style={{ ...styles.td, textAlign: "center" }}>No payment history found.</td></tr> : history.map((inv) => (
                  <tr key={inv.id}><td style={styles.td}>{new Date(inv.created * 1000).toLocaleDateString()}</td><td style={styles.td}>${(inv.amount_paid / 100).toFixed(2)}</td><td style={styles.td}>{inv.status}</td><td style={styles.td}>{inv.hosted_invoice_url && <a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer" style={{ color: "#3b82f6", textDecoration: "none" }}>Download</a>}</td></tr>
                ))}
              </tbody></table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
