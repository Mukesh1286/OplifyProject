// app/dashboard/components/Column.js
"use client";

import React, { useState } from "react";
import TaskCard from "./TaskCard";
import { Droppable, Draggable } from "@hello-pangea/dnd";

export default function Column({
  column,
  tasks = [],
  onAddTask,
  onEditTask,
  onDeleteTask,
  onOpenTask,
}) {
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const handleAdd = async () => {
    if (!title.trim()) return;
    await onAddTask({
      title: title.trim(),
      description: desc.trim(),
      columnId: column.id,
    });
    setTitle("");
    setDesc("");
    setShowNew(false);
  };

  return (
    <div
      style={{
        width: 320,
        background: "#0f172a",
        padding: 12,
        borderRadius: 8,
      }}
    >
      <h3 style={{ color: "#fff", marginTop: 0 }}>{column.title}</h3>

      <Droppable droppableId={column.id} type="TASK">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{ minHeight: 40 }}
          >
            {tasks.map((task, idx) => (
              <Draggable
                key={task._id || task.id}
                draggableId={String(task._id || task.id)}
                index={idx}
              >
                {(prov) => (
                  <div
                    ref={prov.innerRef}
                    {...prov.draggableProps}
                    {...prov.dragHandleProps}
                  >
                    <TaskCard
                      task={task}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      onOpen={onOpenTask}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <div style={{ marginTop: 8 }}>
        {!showNew ? (
          <button
            onClick={() => setShowNew(true)}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 6,
              background: "#fff",
              color: "#0b1220",
            }}
          >
            + Add a card
          </button>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            <input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ padding: 8, borderRadius: 6 }}
            />
            <textarea
              placeholder="Description"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              style={{ padding: 8, borderRadius: 6 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleAdd}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 6,
                  background: "#059669",
                  color: "#fff",
                }}
              >
                Add
              </button>
              <button
                onClick={() => setShowNew(false)}
                style={{ flex: 1, padding: 8, borderRadius: 6 }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
