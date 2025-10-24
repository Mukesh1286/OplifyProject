// app/dashboard/components/TaskCard.js
"use client";

import React from "react";

const initials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export default function TaskCard({ task, onEdit, onDelete, onOpen }) {
  return (
    <div
      onClick={() => onOpen && onOpen(task)}
      style={{
        background: "#0b1220",
        color: "#fff",
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        cursor: "pointer",
      }}
    >
      <div style={{ fontWeight: 700 }}>{task.title}</div>
      {task.description && (
        <div style={{ fontSize: 13, marginTop: 8, color: "#d1d5db" }}>
          {task.description}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 10,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {(task.assignees || []).slice(0, 4).map((a) => (
            <div
              key={a._id || a.id || a.userId}
              title={a.name || a.email}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "#fff",
                color: "#111",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
              }}
            >
              {initials(a.name || a.email || a.userId)}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit && onEdit(task);
            }}
            style={{ padding: "6px 8px", borderRadius: 6 }}
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete && onDelete(task);
            }}
            style={{
              padding: "6px 8px",
              borderRadius: 6,
              background: "#fee2e2",
              color: "#991b1b",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
