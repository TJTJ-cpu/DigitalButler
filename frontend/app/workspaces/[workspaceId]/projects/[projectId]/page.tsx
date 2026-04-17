"use client";

import { useEffect, useState } from "react";
import { SyntheticEvent } from "react";
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
  assigneeId: string | null;
  assigneeEmail: string | null;
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

  const [newTaskName, setNewTaskName] = useState("");
  const [creating, setCreating] = useState(false);

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

  async function handleCreateTask(e: SyntheticEvent){
    e.preventDefault();
    if (!newTaskName.trim())
      return;
    setCreating(true);
    setError(null);
    try {
      const created = await apiFetch<Task>("/api/projects/" + projectId + "/tasks", {
      method: "POST",
      body: JSON.stringify({title: newTaskName.trim()}),
    })
      setTasks((prev) => [...prev, created]);
      setNewTaskName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setCreating(false);
    }
  }

  function tasksForColumn(status: TaskStatus): Task[] {
    return tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position);
  }

  function handleDeleteTask(taskId: string){
    const previousTaks = tasks;

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    previousTaks.filter((t) => t.id !== taskId);
    apiFetch(`/api/tasks/${taskId}`, {method: "DELETE"})
    .catch((err) => {
      setTasks(previousTaks);
      setError(err instanceof Error ? err.message : "Failed to delete task")
    });
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
    <main className="mx-auto max-w-[1400px] px-8 py-10">
      <header className="mb-8">
        <Link href={`/workspaces/${workspaceId}`} className="text-sm text-gray-400 transition-colors hover:text-gray-900">
          &larr; Back to projects
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Board</h1>
      </header>

      <form onSubmit={handleCreateTask} className="mb-8 flex max-w-lg gap-2">
        <input
          type="text"
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          placeholder="New task name"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 transition-colors focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          disabled={creating}
        />
        <button
          type="submit"
          disabled={creating || !newTaskName.trim()}
          className="rounded-lg bg-black px-5 py-2 font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {creating ? "Creating..." : "Add task"}
        </button>
      </form>

      {loading && <p className="text-sm text-gray-500">Loading&hellip;</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {COLUMNS.map((column) => (
            <Droppable key={column.status} droppableId={column.status}>
            {(provided) => (
            <section
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="min-h-[200px] rounded-xl border border-gray-200 bg-gray-900 p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
                  {column.label}
                </h2>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-black">
                  {tasksForColumn(column.status).length}
                </span>
              </div>
              <ul className="space-y-2">
                {tasksForColumn(column.status).map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(dragProvided) => (
                      <li
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className="group rounded-lg border border-gray-200 bg-white p-2 text-gray-900 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium">{task.title}</h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            className="rounded p-1 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                            title="Delete task"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        {task.assigneeEmail && (
                          <div className="mt-2">
                            <span
                              className="inline-block rounded-full px-0.5 py-0.5 text-[7px] font-cs text-white"
                            >
                              {task.assigneeEmail.split("@")[0]}
                            </span>
                          </div>
                        )}
                      </li>
                    )}
                  </Draggable>
                ))}
                {tasksForColumn(column.status).length === 0 && (
                  <li className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-xs text-gray-400">
                    No tasks
                  </li>
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
