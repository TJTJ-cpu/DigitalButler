# Digital Butler — Implementation Roadmap

> A workspace-based Kanban project management app. Built as a portfolio piece to learn full-stack development end-to-end.

## Tech Stack

| Layer            | Technology                                      |
| ---------------- | ----------------------------------------------- |
| Frontend         | Next.js (React), Tailwind CSS, @hello-pangea/dnd |
| Backend API      | C# ASP.NET Core Web API                         |
| Data Access      | Entity Framework Core                           |
| Database         | PostgreSQL                                      |
| Auth             | JWT (access tokens)                             |

---

## Phase 0 — Project Scaffolding & Dev Environment

**Goal:** Get both apps running locally with a connected database.

- [ ] Initialize ASP.NET Core Web API project (`dotnet new webapi -n DigitalButler.Api`)
- [ ] Initialize Next.js frontend (`npx create-next-app@latest frontend`)
- [ ] Set up PostgreSQL (local Docker container or native install)
- [ ] Add EF Core packages: `Npgsql.EntityFrameworkCore.PostgreSQL`, `Microsoft.EntityFrameworkCore.Tools`
- [ ] Configure `appsettings.Development.json` with connection string
- [ ] Verify both apps start and the API returns a health-check response
- [ ] Create `.gitignore` covering both .NET and Node artifacts

**Deliverable:** Two running apps, one database, one repo.

---

## Phase 1 — Database Schema & Entity Models

**Goal:** Define the data layer that everything else builds on.

### Entities to create (in order)

1. **User** — `Id`, `Email`, `PasswordHash`, `CreatedAt`
2. **Workspace** — `Id`, `Name`, `CreatedAt`
3. **WorkspaceMember** — `Id`, `UserId`, `WorkspaceId`, `Role` (enum: Admin, Member, Viewer)
4. **Project** — `Id`, `WorkspaceId`, `Name`, `CreatedAt`
5. **Task** — `Id`, `ProjectId`, `Title`, `Description`, `Status` (enum: Todo, InProgress, Done), `Position`, `CreatedAt`

### Steps

- [ ] Create C# entity classes under `Models/`
- [ ] Create `AppDbContext` with `DbSet<>` for each entity
- [ ] Configure relationships and constraints with Fluent API (composite unique on WorkspaceMember, cascade deletes, index on Task.Position)
- [ ] Run `dotnet ef migrations add InitialCreate`
- [ ] Run `dotnet ef database update` — verify tables in pgAdmin or psql
- [ ] Seed a test workspace + user for development

**Key learning:** EF Core migrations, Fluent API configuration, relational modeling.

---

## Phase 2 — Authentication (Register & Login)

**Goal:** Users can create accounts and receive JWTs.

### Endpoints

| Method | Route               | Purpose                        |
| ------ | ------------------- | ------------------------------ |
| POST   | `/api/auth/register` | Create user, return JWT        |
| POST   | `/api/auth/login`    | Validate credentials, return JWT |

### Steps

- [ ] Add `Microsoft.AspNetCore.Authentication.JwtBearer` and `BCrypt.Net-Next` packages
- [ ] Create `AuthController` with Register and Login actions
- [ ] Hash passwords with BCrypt on registration
- [ ] Generate JWT on successful login (include `UserId` and `Email` as claims)
- [ ] Configure JWT validation in `Program.cs` (issuer, audience, signing key from config)
- [ ] Add `[Authorize]` attribute to a test endpoint and verify with Postman/curl
- [ ] Store JWT secret in user-secrets for development (never in appsettings)

**Key learning:** Password hashing, JWT generation/validation, claims-based identity.

---

## Phase 3 — Workspace & Membership CRUD

**Goal:** Authenticated users can create workspaces and manage members.

### Endpoints

| Method | Route                                  | Purpose                            |
| ------ | -------------------------------------- | ---------------------------------- |
| POST   | `/api/workspaces`                      | Create workspace (creator = Admin) |
| GET    | `/api/workspaces`                      | List workspaces the user belongs to |
| POST   | `/api/workspaces/{id}/members`         | Invite a member (Admin only)       |
| DELETE | `/api/workspaces/{id}/members/{userId}` | Remove a member (Admin only)       |

### Steps

- [ ] Create `WorkspacesController`
- [ ] On workspace creation, auto-insert a `WorkspaceMember` row with Role = Admin for the creator
- [ ] Build a **workspace authorization middleware/filter** that checks membership before allowing access
- [ ] Create DTOs (request/response) — never expose entities directly
- [ ] Write the member management endpoints with role-based checks

**Key learning:** Authorization filters, multi-tenancy patterns, DTOs vs entities.

---

## Phase 4 — Projects & Tasks API

**Goal:** Full CRUD for projects and tasks, scoped to workspaces.

### Endpoints

| Method | Route                             | Purpose                              |
| ------ | --------------------------------- | ------------------------------------ |
| GET    | `/api/workspaces/{id}/projects`   | List projects in a workspace         |
| POST   | `/api/workspaces/{id}/projects`   | Create a project                     |
| GET    | `/api/projects/{id}/tasks`        | Get all tasks for a project (board)  |
| POST   | `/api/projects/{id}/tasks`        | Create a task                        |
| PUT    | `/api/tasks/{id}`                 | Update task title/description        |
| PUT    | `/api/tasks/{id}/move`            | Update status + position (drag/drop) |
| DELETE | `/api/tasks/{id}`                 | Delete a task                        |

### Steps

- [ ] Create `ProjectsController` and `TasksController`
- [ ] For task creation, auto-assign `Position` as max + 1 within the target status column
- [ ] For `/move`, accept `{ newStatus, newPosition }` and reorder affected tasks in a single transaction
- [ ] Ensure all project/task routes validate workspace membership
- [ ] Return tasks grouped or ordered by Status + Position for easy frontend consumption

**Key learning:** Positional ordering logic, transactional updates, nested resource authorization.

---

## Phase 5 — Frontend Foundation & Auth Flow

**Goal:** Next.js app with login/register pages and protected routes.

### Steps

- [ ] Set up Tailwind CSS (should come with create-next-app)
- [ ] Create pages: `/login`, `/register`, `/dashboard`
- [ ] Build auth context/provider that stores JWT in memory (not localStorage for security)
- [ ] Create API client utility (fetch wrapper that attaches JWT to headers)
- [ ] Implement login + register forms that call the backend
- [ ] Add route protection: redirect unauthenticated users to `/login`
- [ ] Display a basic dashboard listing the user's workspaces

**Key learning:** React context, token management, protected routing in Next.js App Router.

---

## Phase 6 — Kanban Board UI

**Goal:** The drag-and-drop board — the centerpiece of the app.

### Steps

- [ ] Install `@hello-pangea/dnd`
- [ ] Build the board layout: three columns (Todo, In Progress, Done)
- [ ] Fetch tasks from `GET /api/projects/{id}/tasks` on board load
- [ ] Render tasks as draggable cards within their status columns
- [ ] On drag-end, **optimistically update local state** immediately
- [ ] Fire `PUT /api/tasks/{id}/move` in the background
- [ ] On API failure, **roll back** the card to its previous position and show an error toast
- [ ] Add "New Task" button per column with an inline form

**Key learning:** Optimistic UI updates, drag-and-drop libraries, state rollback patterns.

---

## Phase 7 — Polish & Portfolio-Ready

**Goal:** Make it presentable and deployable.

- [ ] Add loading skeletons and error states across pages
- [ ] Add workspace switcher in the sidebar/header
- [ ] Add member list view within a workspace
- [ ] Responsive design pass (mobile-friendly board)
- [ ] Write a project README with screenshots, tech stack, and architecture diagram
- [ ] Containerize both apps with Docker + docker-compose
- [ ] Deploy: backend to Azure App Service or Railway, frontend to Vercel, database to Neon or Supabase Postgres

---

## Stretch Goals (Post-MVP)

- [ ] Real-time updates with SignalR (WebSockets) — multiple users see board changes live
- [ ] Task comments and activity log
- [ ] File attachments (Azure Blob Storage or S3)
- [ ] Due dates with calendar view
- [ ] Dark mode toggle
- [ ] CI/CD pipeline with GitHub Actions (build, test, deploy)

---

## Development Conventions

- **Backend:** Follow standard ASP.NET Core project structure (`Controllers/`, `Models/`, `DTOs/`, `Services/`, `Data/`)
- **Frontend:** Use Next.js App Router with `app/` directory structure
- **Branching:** Work on feature branches, merge to `main` via PR
- **Never commit secrets** — use `dotnet user-secrets` and `.env.local`

---

## Git Commit Message Convention

This project uses **Conventional Commits** for a clean, readable history.

### Format

```
<type>[optional scope]: <description>

[optional body]
```

### Commit Types

| Type       | When to use                                                        |
| ---------- | ------------------------------------------------------------------ |
| `feat`     | A new feature is introduced                                        |
| `fix`      | A bug fix                                                          |
| `chore`    | Maintenance that doesn't touch src or tests (e.g. updating deps)   |
| `refactor` | Code restructuring without changing behavior                       |
| `docs`     | Documentation changes (README, comments, markdown)                 |
| `style`    | Formatting only (whitespace, semicolons) — no logic changes        |
| `test`     | Adding or updating tests                                           |
| `perf`     | Performance improvements                                           |
| `ci`       | CI/CD pipeline changes                                             |
| `build`    | Build system or external dependency changes                        |

### Rules

1. **Type and description are lowercase** — `feat: add user model`, not `Feat: Add user model`
2. **Use imperative mood** — "add", "fix", "update", not "added", "fixed", "updated"
3. **Subject line ≤ 50 characters** — be concise and direct
4. **No period at the end** of the subject line
5. **Body (optional) wraps at 72 characters** — use it to explain *why*, not *what*
6. **Scope is optional** — use it to clarify area: `feat(auth): add JWT validation`

### Examples

```bash
# Good
feat: add user and workspace entity models
fix: prevent duplicate workspace members
chore: update EF Core packages to latest version
refactor(api): extract auth logic into service layer
docs: add phase 1 completion notes to roadmap

# Bad
Fixed stuff                  # vague, past tense, no type
feat: Add User Model.        # capitalized, period at end
update                       # no type, no context
WIP                          # not descriptive
```

### Multi-line Commit (when more context is needed)

```bash
git commit -m "feat(board): add drag-and-drop task reordering" -m "Implements optimistic UI updates with rollback on API failure.
Uses @hello-pangea/dnd for drag handling and PATCH /api/tasks/:id/move
for persistence."
```
