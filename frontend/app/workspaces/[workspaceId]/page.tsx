"use client";

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

  if (!user) return null;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-6">
        <Link href="/dashboard" className="text-sm text-gray-500 underline">
          ← Back to workspaces
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Projects</h1>
      </header>

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
