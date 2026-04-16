"use client";

import { SyntheticEvent } from "react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api-client";

type Project = {
  id: string;
  name: string;
};

export default function WorkspaceDetailPage() {
  const router = useRouter();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user } = useAuth();

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
    setCreating(false);
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

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-6">
        <Link href="/dashboard" className="text-sm text-gray-500 underline">
          ← Back to workspaces
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Projects</h1>
      </header>
      <form onSubmit={handleCreateProject} className="mb-6 flex gap-2">
        <input
          type="text"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder="New project name"
          className="flex-1 rounded border border-gray-300 px-3 py-2"
          disabled={creating}
        />
        <button
          type="submit"
          disabled={creating || !newProjectName.trim()}
          className="rounded bg-black px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create"}
        </button>
      </form>


      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && projects.length === 0 && (
        <p className="text-sm text-gray-500">No projects in this workspace yet.</p>
      )}

      <ul className="space-y-2">
        {projects.map((p) => (
          <li key={p.id}>
            <Link
              href={`/workspaces/${workspaceId}/projects/${p.id}`}
              className="block rounded border border-gray-200 p-4 hover:bg-gray-50"
            >
              <h2 className="font-medium">{p.name}</h2>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
