"use client";

import { SyntheticEvent } from "react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api-client";
import ConfirmationModal from "@/app/component/ConfirmationModel";

type Project = {
  id: string;
  name: string;
};

export default function WorkspaceDetailPage() {
  const router = useRouter();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    apiFetch<Project[]>(`/api/workspaces/${workspaceId}/projects`)
      .then((data) => setProjects(data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load projects")
      )
      .finally(() => setLoading(false));
  }, [user, router, workspaceId]);

  if (!user)
    return null;

  async function handleCreateProject(e: SyntheticEvent){
    e.preventDefault();
    if (!newProjectName.trim())
      return;
    setCreating(true);
    setError(null);

    try {
    const created = await apiFetch<Project>("/api/workspaces/" + workspaceId + "/projects", {
    method: "POST",
    body: JSON.stringify({name: newProjectName.trim()}),
    });
    setProjects((prev) => [...prev, created]);
    setNewProjectName("")
    } catch (err) {
      setError(err instanceof Error ? err.message :"Failed to create project"  );
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteProject(projectID : string) {
    const previousProjects = projects;
    setProjects((prev) => prev.filter((t) => t.id !== projectID));

    await apiFetch<Project>(`/api/workspaces/${workspaceId}/projects/${projectID}`, {
    method: "DELETE",
    }).catch((err) => {
      setProjects(previousProjects);
      setError(err instanceof Error ? err.message : "Failed to delete project")
    });
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-8">
        <Link href="/dashboard" className="text-sm text-gray-400 transition-colors hover:text-gray-600">
          &larr; Back to workspaces
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Projects</h1>
      </header>

      <form onSubmit={handleCreateProject} className="mb-8 flex gap-2">
        <input
          type="text"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder="New project name"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 transition-colors focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          disabled={creating}
        />
        <button
          type="submit"
          disabled={creating || !newProjectName.trim()}
          className="rounded-lg bg-black px-5 py-2 font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {creating ? "Creating..." : "Create"}
        </button>
      </form>

      {loading && <p className="text-sm text-gray-500">Loading&hellip;</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && projects.length === 0 && (
        <p className="text-sm text-gray-500">No projects in this workspace yet.</p>
      )}

      <ul className="space-y-2">
        {projects.map((p) => (
          <li key={p.id} className="group flex items-center gap-2">
            <Link
              href={`/workspaces/${workspaceId}/projects/${p.id}`}
              className="block flex-1 rounded-lg border border-gray-200 p-4 transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm hover:text-black"
            >
              <h2 className="font-medium">{p.name}</h2>
            </Link>

            <button
              onClick={() => setDeleteTarget(p.id)}
              className="rounded p-1.5 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
              title="Delete project"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      <ConfirmationModal
        isOpen={deleteTarget !== null}
        title="Delete project"
        message="Are you sure? This will delete the project and all its tasks."
        onConfirm={() => {
          if (deleteTarget) handleDeleteProject(deleteTarget);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
