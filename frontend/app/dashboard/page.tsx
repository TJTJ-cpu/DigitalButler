"use client";

import { SyntheticEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { apiFetch } from "../lib/api-client";

import Link from "next/link"
import ConfirmationModal from "../component/ConfirmationModel";

type Workspace = {
  id: string;
  name: string;
  createdAt: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [newWorkspaceName, setWorkspacesName] = useState("");
  const [creating, setCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    apiFetch<Workspace[]>("/api/workspaces")
      .then((data) => setWorkspaces(data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load workspaces")
      )
      .finally(() => setLoading(false));
  }, [user, router]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  async function handleCreateWorkspace(e: SyntheticEvent) {
    e.preventDefault();
    if (!newWorkspaceName.trim())
      return;
    setCreating(true);
    setError(null);

    try {
      const created = await apiFetch<Workspace>("/api/workspaces", {
        method: "POST",
        body: JSON.stringify({name:newWorkspaceName.trim()}),
      });
      setWorkspaces((prevWorkspace) => [...prevWorkspace, created]);
      setWorkspacesName("");
    } catch (err) {
      setError(err instanceof Error ? err.message: "Failed to create workspace")
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteWorkspace(workspaceId:string) {
    const previoudWorkspace = workspaces;
    setWorkspaces((prev)=> prev.filter((t) => t.id !== workspaceId));
    // endpoint
    await apiFetch<Workspace>(`/api/workspaces/${workspaceId}`,{
      method: "DELETE"
    }).catch ((err) =>{
      setWorkspaces(previoudWorkspace);
      setError(err instanceof Error ? err.message :  "Failed to delete project");
    }
  )
    
    
  }

  if (!user) {
    return null;
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your workspaces</h1>
          <p className="mt-1 text-sm text-gray-500">Signed in as {user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50"
        >
          Log out
        </button>
      </header>

      <form onSubmit={handleCreateWorkspace} className="mb-8 flex gap-2">
        <input
          type="text"
          value={newWorkspaceName}
          onChange={(e) => setWorkspacesName(e.target.value)}
          placeholder="New workspace name"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 transition-colors focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          disabled={creating}
        />
        <button
          type="submit"
          disabled={creating || !newWorkspaceName.trim()}
          className="rounded-lg bg-black px-5 py-2 font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {creating ? "Creating..." : "Create"}
        </button>
      </form>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && workspaces.length === 0 && (
        <p className="text-sm text-gray-500">
          You don&apos;t belong to any workspaces yet.
        </p>
      )}

      <ul className="space-y-2">
        {workspaces.map((ws) => (
          <li key={ws.id} className="group flex items-center gap-2">
            <Link
              href={`/workspaces/${ws.id}`}
              className="block flex-1 rounded-lg border border-gray-200 p-4 transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm hover:text-black"
            >
              <h2 className="font-medium">{ws.name}</h2>
              <p className="text-xs text-gray-400">
                Created {new Date(ws.createdAt).toLocaleDateString()}
              </p>
            </Link>
            <button
              onClick={() => setDeleteTarget(ws.id)}
              className="rounded p-1.5 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
              title="Delete workspace"
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
        title="Delete workspace"
        message="Are you sure? This will delete the workspace and all its projects."
        onConfirm={() => {
          if (deleteTarget) handleDeleteWorkspace(deleteTarget);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
