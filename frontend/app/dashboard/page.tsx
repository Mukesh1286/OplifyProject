// app/dashboard/page.js
"use client";

import React, { useEffect, useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { useTasks } from "../contexts/TaskContext";
import Column from "./components/Column";
import TaskModal from "./components/TaskModal";

function reorder(list, startIndex, endIndex) {
  const result = Array.from(list || []);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

export default function DashboardPage() {
  const {
    columns,
    tasksByColumn,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    addColumn,
  } = useTasks();

  const [localTasks, setLocalTasks] = useState({});
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [openTask, setOpenTask] = useState(null);

  const [newColTitle, setNewColTitle] = useState("");

  useEffect(() => {
    (async () => {
      setLoadingBoard(true);
      await loadTasks();
      setLoadingBoard(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalTasks(tasksByColumn || {});
  }, [tasksByColumn]);

  const handleAddTask = async ({ title, description, columnId }) => {
    // optimistic insert with temp id
    const tempId = `temp-${Date.now()}`;
    const tempTask = {
      id: tempId,
      title,
      description,
      columnId,
      assignees: [],
    };
    setLocalTasks((prev) => ({
      ...prev,
      [columnId]: [tempTask, ...(prev[columnId] || [])],
    }));
    const resp = await createTask({ title, description, columnId });
    if (resp.ok) {
      const created = resp.data;
      setLocalTasks((prev) => {
        const copy = {};
        Object.keys(prev).forEach((k) => {
          copy[k] = prev[k].map((t) => (t.id === tempId ? created : t));
        });
        return copy;
      });
    } else {
      // remove temp, reload
      await loadTasks();
      alert("Create failed: " + JSON.stringify(resp.error));
    }
  };

  const handleDeleteTask = async (task) => {
    if (!confirm("Delete this task?")) return;
    // optimistic remove
    setLocalTasks((prev) => {
      const copy = {};
      Object.keys(prev).forEach((k) => {
        copy[k] = prev[k].filter(
          (t) => (t._id || t.id) !== (task._id || task.id)
        );
      });
      return copy;
    });
    const resp = await deleteTask(task._id || task.id);
    if (!resp.ok) {
      alert("Delete failed; reloading tasks");
      await loadTasks();
    }
  };

  const handleOpenTask = (task) => {
    setOpenTask(task);
    setModalOpen(true);
  };

  const handleSaveFromModal = async (taskId, updates) => {
    // optimistic update
    setLocalTasks((prev) => {
      const copy = {};
      Object.keys(prev).forEach((k) => {
        copy[k] = prev[k].map((t) =>
          (t._id || t.id) === taskId ? { ...t, ...updates } : t
        );
      });
      return copy;
    });

    const resp = await updateTask(taskId, updates);
    if (!resp.ok) {
      alert("Save failed; reloading");
      await loadTasks();
    } else {
      await loadTasks();
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    const fromCol = source.droppableId;
    const toCol = destination.droppableId;
    const fromIndex = source.index;
    const toIndex = destination.index;

    if (fromCol === toCol) {
      setLocalTasks((prev) => ({
        ...prev,
        [fromCol]: reorder(prev[fromCol] || [], fromIndex, toIndex),
      }));
      return;
    }

    // optimistic move
    setLocalTasks((prev) => {
      const copy = JSON.parse(JSON.stringify(prev || {}));
      const fromList = copy[fromCol] || [];
      const idx = fromList.findIndex((t) => (t._id || t.id) === draggableId);
      if (idx === -1) return prev;
      const [task] = fromList.splice(idx, 1);
      const updated = { ...task, columnId: toCol };
      copy[toCol] = copy[toCol] || [];
      copy[toCol].splice(toIndex, 0, updated);
      return copy;
    });

    const resp = await moveTask(draggableId, fromCol, toCol, toIndex);
    if (!resp.ok) {
      alert("Move failed; reloading tasks");
      await loadTasks();
    } else {
      await loadTasks();
    }
  };

  const handleAddColumn = async () => {
    if (!newColTitle.trim()) return;
    const resp = await addColumn({
      title: newColTitle.trim(),
      boardId: "main",
    });
    if (resp.ok) {
      setNewColTitle("");
      // reload tasks/columns to reflect backend result
      await loadTasks();
    } else {
      alert("Failed to add column; created locally");
      await loadTasks();
    }
  };

  if (loadingBoard) return <div>Loading tasks...</div>;

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h1 style={{ margin: 0 }}>Board</h1>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <input
            placeholder="New column title"
            value={newColTitle}
            onChange={(e) => setNewColTitle(e.target.value)}
            style={{ padding: 8 }}
          />
          <button onClick={handleAddColumn} style={{ padding: "8px 12px" }}>
            Add Column
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div
          style={{
            display: "flex",
            gap: 16,
            overflowX: "auto",
            paddingBottom: 24,
          }}
        >
          {columns.map((col) => (
            <Column
              key={col.id}
              column={col}
              tasks={localTasks?.[col.id] || []}
              onAddTask={({ title, description }) =>
                handleAddTask({ title, description, columnId: col.id })
              }
              onEditTask={(task) => {
                setOpenTask(task);
                setModalOpen(true);
              }}
              onDeleteTask={handleDeleteTask}
              onOpenTask={handleOpenTask}
            />
          ))}
        </div>
      </DragDropContext>

      <TaskModal
        task={openTask}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setOpenTask(null);
        }}
        onSave={handleSaveFromModal}
      />
    </div>
  );
}
