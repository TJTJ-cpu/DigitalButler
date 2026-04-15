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
