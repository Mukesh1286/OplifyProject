// app/contexts/TaskContext.js
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const API_BASE = "http://localhost:5000";
const TaskContext = createContext();

function readAuthToken() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || parsed?.accessToken || null;
  } catch {
    return null;
  }
}

async function apiFetch(path, opts = {}) {
  const token = readAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const text = await res.text().catch(() => "");
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) throw data || { message: `HTTP ${res.status}` };
  return data;
}

function looksLikeObjectId(val) {
  return typeof val === "string" && /^[0-9a-fA-F]{24}$/.test(val);
}

export const TaskProvider = ({ children }) => {
  // default UI columns (friendly labels). We will try to replace with server columns on init.
  const [columns, setColumns] = useState([
    { id: "todo", title: "To Do" },
    { id: "doing", title: "Doing" },
    { id: "done", title: "Done" },
  ]);

  // tasks by column key (could be backend id or friendly id)
  const [tasksByColumn, setTasksByColumn] = useState({
    todo: [],
    doing: [],
    done: [],
  });
  const [columnMap, setColumnMap] = useState({}); // friendly->backendId
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Attempt to load server columns from likely endpoints and build mapping
  const loadColumnsFromServer = async (boardId = "main") => {
    const tries = [
      `/api/columns`,
      `/api/board/${boardId}/columns`,
      `/api/task/columns/${boardId}`,
      `/api/task/columns`,
    ];

    for (const p of tries) {
      try {
        const resp = await apiFetch(p, { method: "GET" });
        const arr = Array.isArray(resp)
          ? resp
          : resp?.data || resp?.columns || resp?.result || [];
        if (Array.isArray(arr) && arr.length > 0) {
          // map server columns into UI columns (use backend id as UI id)
          const serverCols = arr.map((c) => ({
            id: c._id || c.id,
            title:
              c.title || c.name || c.label || c.slug || String(c._id || c.id),
            raw: c,
          }));
          setColumns(serverCols);

          const map = {};
          arr.forEach((c) => {
            const backendId = c._id || c.id;
            if (!backendId) return;
            if (c.slug) map[c.slug] = backendId;
            if (c.title) map[c.title.toLowerCase()] = backendId;
            if (c.name) map[c.name.toLowerCase()] = backendId;
            map[backendId] = backendId;
          });

          // map friendly labels if titles match
          const friendly = { todo: "To Do", doing: "Doing", done: "Done" };
          Object.keys(friendly).forEach((k) => {
            const found = arr.find((c) => {
              const title = (c.title || c.name || "").toLowerCase();
              return title.includes(friendly[k].toLowerCase().split(" ")[0]);
            });
            if (found) map[k] = found._id || found.id;
          });

          setColumnMap(map);
          console.log("Loaded server columns from", p, "map:", map);
          return { ok: true, map, columns: serverCols };
        }
      } catch (err) {
        console.warn("Column fetch failed at", p, err);
      }
    }

    // fallback: keep friendly labels
    const fallback = { todo: "todo", doing: "doing", done: "done" };
    setColumnMap(fallback);
    console.warn(
      "No server columns found; using fallback columnMap:",
      fallback
    );
    return { ok: false };
  };

  // Load tasks and bucket them by column key (server id or friendly)
  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await apiFetch("/api/task/getTask", { method: "GET" });
      const rawTasks = Array.isArray(resp)
        ? resp
        : resp?.data || resp?.tasks || resp?.result || [];
      const byCol = {};

      (rawTasks || []).forEach((t) => {
        const colCandidate =
          t.columnId ||
          (t.column && (t.column._id || t.column.id)) ||
          (typeof t.column === "string" ? t.column : null) ||
          "todo";
        const key = String(colCandidate);
        if (!byCol[key]) byCol[key] = [];
        byCol[key].push(t);
      });

      // prepare next buckets using current columns
      const next = {};
      columns.forEach((c) => {
        next[c.id] = byCol[c.id] || [];
      });
      // include any other backend column keys
      Object.keys(byCol).forEach((k) => {
        if (!next[k]) next[k] = byCol[k];
      });

      setTasksByColumn(next);
      setLoading(false);
      return { ok: true };
    } catch (err) {
      console.error("loadTasks error:", err);
      setError(err);
      setLoading(false);
      return { ok: false, error: err };
    }
  };

  const resolveColumnId = (columnKey) => {
    if (!columnKey) return columnKey;
    if (looksLikeObjectId(columnKey)) return columnKey;
    if (columnMap[columnKey]) return columnMap[columnKey];
    const lc = String(columnKey).toLowerCase();
    if (columnMap[lc]) return columnMap[lc];
    const found = columns.find(
      (c) => (c.title || "").toLowerCase().includes(lc) || c.id === columnKey
    );
    if (found) return found.id;
    return columnKey;
  };

  // CREATE TASK
  const createTask = async ({ title, description = "", columnId = "todo" }) => {
    setLoading(true);
    try {
      const backendCol = resolveColumnId(columnId);
      const body = { title, description, columnId: backendCol };
      const data = await apiFetch(`/api/task/columns/${backendCol}/tasks`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      const created = data?.task || data;
      if (!created) throw new Error("Invalid create response");
      setTasksByColumn((prev) => ({
        ...prev,
        [backendCol]: [created, ...(prev[backendCol] || [])],
      }));
      setLoading(false);
      return { ok: true, data: created };
    } catch (err) {
      setLoading(false);
      console.error("createTask failed:", err);
      return { ok: false, error: err };
    }
  };

  // UPDATE TASK
  const updateTask = async (taskId, updates) => {
    setLoading(true);
    try {
      if (updates?.columnId && !looksLikeObjectId(updates.columnId)) {
        updates.columnId = resolveColumnId(updates.columnId);
      }
      const data = await apiFetch(`/api/task/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      const updated = data?.task || data;
      setTasksByColumn((prev) => {
        const copy = {};
        Object.keys(prev).forEach((colId) => {
          copy[colId] = prev[colId].map((t) =>
            (t._id || t.id) === taskId ? { ...t, ...updated } : t
          );
        });
        if (updates.columnId) {
          Object.keys(copy).forEach((colId) => {
            copy[colId] = copy[colId].filter((t) => (t._id || t.id) !== taskId);
          });
          const toCol = updates.columnId;
          copy[toCol] = [updated, ...(copy[toCol] || [])];
        }
        return copy;
      });
      setLoading(false);
      return { ok: true, data: updated };
    } catch (err) {
      setLoading(false);
      console.error("updateTask failed:", err);
      return { ok: false, error: err };
    }
  };

  // DELETE TASK
  const deleteTask = async (taskId) => {
    setLoading(true);
    try {
      await apiFetch(`/api/task/tasks/${taskId}`, { method: "DELETE" });
      setTasksByColumn((prev) => {
        const copy = {};
        Object.keys(prev).forEach((colId) => {
          copy[colId] = prev[colId].filter((t) => (t._id || t.id) !== taskId);
        });
        return copy;
      });
      setLoading(false);
      return { ok: true };
    } catch (err) {
      setLoading(false);
      console.error("deleteTask failed:", err);
      return { ok: false, error: err };
    }
  };

  // ASSIGNEES
  const listAssignees = async (taskId) => {
    try {
      const data = await apiFetch(`/api/assignee/${taskId}`, { method: "GET" });
      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: err };
    }
  };
  const addAssignee = async (taskId, userId) => {
    try {
      const data = await apiFetch(`/api/assignee`, {
        method: "POST",
        body: JSON.stringify({ taskId, userId }),
      });
      const assignee = data?.assignee || data;
      setTasksByColumn((prev) => {
        const copy = {};
        Object.keys(prev).forEach((colId) => {
          copy[colId] = prev[colId].map((t) => {
            if ((t._id || t.id) === taskId) {
              const existing = t.assignees || [];
              return { ...t, assignees: [...existing, assignee] };
            }
            return t;
          });
        });
        return copy;
      });
      return { ok: true, data: assignee };
    } catch (err) {
      return { ok: false, error: err };
    }
  };
  const removeAssignee = async (taskId, userId) => {
    try {
      await apiFetch(`/api/assignee/${taskId}/${userId}`, { method: "DELETE" });
      setTasksByColumn((prev) => {
        const copy = {};
        Object.keys(prev).forEach((colId) => {
          copy[colId] = prev[colId].map((t) => {
            if ((t._id || t.id) === taskId) {
              return {
                ...t,
                assignees: (t.assignees || []).filter(
                  (a) => (a._id || a.id || a.userId) !== userId
                ),
              };
            }
            return t;
          });
        });
        return copy;
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err };
    }
  };

  // MOVE TASK (optimistic)
  const moveTask = async (taskId, fromCol, toCol, toIndex = 0) => {
    const backendTo = resolveColumnId(toCol);
    setTasksByColumn((prev) => {
      const copy = JSON.parse(JSON.stringify(prev || {}));
      const fromList = copy[fromCol] || [];
      const idx = fromList.findIndex((t) => (t._id || t.id) === taskId);
      if (idx === -1) return prev;
      const [task] = fromList.splice(idx, 1);
      const updated = { ...task, columnId: backendTo };
      copy[backendTo] = copy[backendTo] || [];
      copy[backendTo].splice(toIndex, 0, updated);
      return copy;
    });

    try {
      const resp = await updateTask(taskId, { columnId: backendTo });
      if (!resp.ok) throw resp.error;
      return { ok: true };
    } catch (err) {
      await loadTasks();
      return { ok: false, error: err };
    }
  };

  // ADD COLUMN: try server, if fails create local column
  const addColumn = async ({ title, boardId = "main", idHint = null }) => {
    setLoading(true);
    const slug = (title || "").toLowerCase().replace(/\s+/g, "-");
    // try server endpoints for creating columns
    const tries = [
      { path: "/api/columns", body: { title, slug } },
      { path: `/api/board/${boardId}/columns`, body: { title, slug } },
      { path: `/api/task/columns`, body: { title, slug, boardId } },
      { path: `/api/task/columns/${boardId}`, body: { title, slug } },
    ];

    for (const t of tries) {
      try {
        const resp = await apiFetch(t.path, {
          method: "POST",
          body: JSON.stringify(t.body),
        });
        // resp may contain created column as resp.column or resp.data or resp
        const created = resp?.column || resp?.data || resp;
        if (created) {
          const backendId =
            created._id || created.id || created._idString || slug;
          const newCol = {
            id: backendId,
            title: created.title || title,
            raw: created,
          };
          setColumns((prev) => [...prev, newCol]);
          setColumnMap((m) => ({
            ...m,
            [slug]: backendId,
            [backendId]: backendId,
            [title.toLowerCase()]: backendId,
          }));
          setTasksByColumn((prev) => ({ ...prev, [backendId]: [] }));
          setLoading(false);
          return { ok: true, data: created };
        }
      } catch (err) {
        console.warn("create column failed at", t.path, err);
      }
    }

    // fallback: create local column using idHint or slug + timestamp
    const localId = idHint || `${slug}-${Date.now().toString().slice(6)}`;
    const localCol = { id: localId, title };
    setColumns((prev) => [...prev, localCol]);
    setColumnMap((m) => ({
      ...m,
      [localId]: localId,
      [slug]: localId,
      [title.toLowerCase()]: localId,
    }));
    setTasksByColumn((prev) => ({ ...prev, [localId]: [] }));
    setLoading(false);
    return { ok: true, local: true, data: localCol };
  };

  // init: try load server columns then tasks
  useEffect(() => {
    (async () => {
      await loadColumnsFromServer("main");
      await loadTasks();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TaskContext.Provider
      value={{
        columns,
        tasksByColumn,
        columnMap,
        loading,
        error,
        loadTasks,
        createTask,
        updateTask,
        deleteTask,
        listAssignees,
        addAssignee,
        removeAssignee,
        moveTask,
        addColumn,
        resolveColumnId,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);
export default TaskContext;
