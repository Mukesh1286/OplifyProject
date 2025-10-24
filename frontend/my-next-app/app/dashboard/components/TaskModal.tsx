// app/dashboard/components/TaskModal.js
"use client";

import React, { useEffect, useState } from "react";
import { useTasks } from "../../contexts/TaskContext";

export default function TaskModal({ task, open, onClose, onSave }) {
  const { listAssignees, addAssignee, removeAssignee } = useTasks();

  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [assignees, setAssignees] = useState(task?.assignees || []);
  const [newAssignee, setNewAssignee] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitle(task?.title || "");
    setDescription(task?.description || "");
    setAssignees(task?.assignees || []);
    if (task?.id || task?._id) {
      (async () => {
        const resp = await listAssignees(task._id || task.id);
        if (resp.ok) setAssignees(resp.data || []);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);

  if (!open || !task) return null;

  const handleSave = async () => {
    setLoading(true);
    const updates = { title, description };
    // call onSave passed from parent (Page)
    await onSave(task._id || task.id, updates);
    setLoading(false);
    onClose();
  };

  const handleAddAssignee = async () => {
    if (!newAssignee.trim()) return;
    const resp = await addAssignee(task._id || task.id, newAssignee.trim());
    if (resp.ok) {
      setAssignees((p) => [...(p || []), resp.data]);
      setNewAssignee("");
    } else {
      alert("Add assignee failed");
    }
  };

  const handleRemoveAssignee = async (userId) => {
    const resp = await removeAssignee(task._id || task.id, userId);
    if (resp.ok) {
      setAssignees((p) =>
        (p || []).filter((a) => (a._id || a.id || a.userId) !== userId)
      );
    } else {
      alert("Remove assignee failed");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
      }}
    >
      <div
        style={{ width: 720, background: "#fff", borderRadius: 8, padding: 20 }}
      >
        <h3 style={{ marginTop: 0 }}>Task details</h3>
        <div style={{ display: "grid", gap: 8 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: 8 }}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{ padding: 8 }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <h4>Assignees</h4>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(assignees || []).map((a) => (
              <div
                key={a._id || a.id || a.userId}
                style={{
                  padding: "6px 8px",
                  borderRadius: 8,
                  background: "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  {(a.name || a.email || a.userId || "")
                    .split(" ")
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div>{a.name || a.email || a.userId}</div>
                <button
                  onClick={() =>
                    handleRemoveAssignee(a._id || a.id || a.userId)
                  }
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#dc2626",
                  }}
                >
                  x
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              placeholder="userId or email"
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              style={{ flex: 1, padding: 8 }}
            />
            <button onClick={handleAddAssignee} style={{ padding: "8px 12px" }}>
              Add
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 16,
          }}
        >
          <button onClick={onClose} style={{ padding: "8px 12px" }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "8px 12px",
              background: "#059669",
              color: "#fff",
            }}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
