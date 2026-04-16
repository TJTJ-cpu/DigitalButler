"use client";

import { SyntheticEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { apiFetch } from "../lib/api-client";

import Link from "next/link"

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

  if (!user) {
    return null;
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your workspaces</h1>
          <p className="text-sm text-gray-600">Signed in as {user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
        >
          Log out
        </button>
      </header>

      <form onSubmit={handleCreateWorkspace} className="mb-6 flex gap-2">
        <input
          type="text"
          value={newWorkspaceName}
          onChange={(e) => setWorkspacesName(e.target.value)}
          placeholder="New workspace name"
          className="flex-1 rounded border border-gray-300 px-3 py-2"
          disabled={creating}
        />
        <button
          type="submit"
          disabled={creating || !newWorkspaceName.trim()}
          className="rounded bg-black px-4 py-2 font-medium text-white disabled:opacity-50"
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
          <li key={ws.id}>
            <Link
              href={`/workspaces/${ws.id}`}
              className="block rounded border border-gray-200 p-4 hover:bg-gray-50"
            >
              <h2 className="font-medium">{ws.name}</h2>
              <p className="text-xs text-gray-500">
                Created {new Date(ws.createdAt).toLocaleDateString()}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
