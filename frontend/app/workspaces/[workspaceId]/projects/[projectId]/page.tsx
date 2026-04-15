"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../lib/auth-context";
import { apiFetch } from "../../../../lib/api-client";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

type TaskStatus = "Todo" | "InProgress" | "Done";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  position: number;
  createdAt: string;
};

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "Todo", label: "To Do" },
  { status: "InProgress", label: "In Progress" },
  { status: "Done", label: "Done" },
];

export default function ProjectBoardPage() {
  const router = useRouter();
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    apiFetch<Task[]>(`/api/projects/${projectId}/tasks`)
      .then((data) => setTasks(data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load tasks")
      )
      .finally(() => setLoading(false));
  }, [user, router, projectId]);

  if (!user)
    return null;

  function tasksForColumn(status: TaskStatus): Task[] {
    return tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position);
  }

  function handleDragEnd (result: DropResult) {

    const {source, destination, draggableId} = result;
    if (!destination)
        return;

    if (source.droppableId === destination.droppableId &&
      source.index === destination.index)
      return;

    const sourceStatus = source.droppableId as TaskStatus;
    const destStatus = destination.droppableId as TaskStatus;

    const previousTaks = tasks;

    setTasks((prev) => {
      const movedTask = prev.find((t) => t.id === draggableId);
      if (!movedTask)
        return prev;

      const sortedColumn = (status: TaskStatus) =>
        prev.filter((t) => t.status === status).sort((a, b) => a.position - b.position);

      if (sourceStatus === destStatus){
        const column = sortedColumn(sourceStatus);
        column.splice(source.index, 1);
        column.splice(destination.index, 0, movedTask);

      return [
        ...prev.filter((t) => t.status !== sourceStatus),
        ...column.map((t, i) => ({ ...t, position: i })),
      ];
      } else {
        const sourceCol = sortedColumn(sourceStatus);
        const destCol = sortedColumn(destStatus);

        sourceCol.splice(source.index, 1);
        const updatedTask = { ...movedTask, status: destStatus};
        destCol.splice(destination.index, 0, updatedTask);

        return [
          ...prev.filter(
            (t) => t.status !== sourceStatus &&
            t.status !== destStatus),
            ...sourceCol.map((t, i) => ({...t, position: i})),
            ...destCol.map((t, i) => ({...t, position: i})),
        ];
      }
    })

    apiFetch(`/api/tasks/${draggableId}/move`,{
      method: "PUT",
      body: JSON.stringify({
        newStatus: destStatus,
        newPosition: destination.index,
      }),
    }).catch((err) =>{
      setTasks(previousTaks);
      setError(err instanceof Error ? err.message : "Failed to move task");
    });


  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="mb-6">
        <Link href={`/workspaces/${workspaceId}`} className="text-sm text-gray-500 underline">
          ← Back to projects
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Board</h1>
      </header>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COLUMNS.map((column) => (
            <Droppable key={column.status} droppableId={column.status}>
            {(provided) => (
            <section
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="rounded-lg border border-gray-200 bg-gray-50 p-3"
            >
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
                {column.label}
              </h2>
              <ul className="space-y-2">
                {tasksForColumn(column.status).map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(dragProvided) => (
                      <li
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className="rounded border border-gray-200 bg-white p-3 text-gray-900 shadow-sm"
                      >
                        <h3 className="font-medium">{task.title}</h3>
                      </li>
                    )}
                  </Draggable>
                ))}
                {tasksForColumn(column.status).length === 0 && (
                  <li className="text-center text-xs text-gray-400">No tasks</li>
                )}
              </ul>
              {provided.placeholder}
            </section>
              )}
            </Droppable>
          ))}
        </div>
        </DragDropContext>
      )}
    </main>
  );
}
