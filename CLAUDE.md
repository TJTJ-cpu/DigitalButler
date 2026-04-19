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

- [x] Initialize ASP.NET Core Web API project (`dotnet new webapi -n DigitalButler.Api`)
- [x] Initialize Next.js frontend (`npx create-next-app@latest frontend`)
- [x] Set up PostgreSQL (local native install)
- [x] Add EF Core packages: `Npgsql.EntityFrameworkCore.PostgreSQL`, `Microsoft.EntityFrameworkCore.Tools`
- [x] Configure `appsettings.Development.json` with connection string
- [x] Verify both apps start and the API returns a health-check response
- [x] Create `.gitignore` covering both .NET and Node artifacts

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

- [x] Create C# entity classes under `Models/`
- [x] Create `AppDbContext` with `DbSet<>` for each entity
- [x] Configure relationships and constraints with Fluent API (composite unique on WorkspaceMember, cascade deletes, index on Task.Position)
- [x] Run `dotnet ef migrations add InitialCreate`
- [x] Run `dotnet ef database update` — verify tables in pgAdmin or psql
- [x] Seed a test workspace + user for development

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

- [x] Add `Microsoft.AspNetCore.Authentication.JwtBearer` and `BCrypt.Net-Next` packages
- [x] Create `AuthController` with Register and Login actions
- [x] Hash passwords with BCrypt on registration
- [x] Generate JWT on successful login (include `UserId` and `Email` as claims)
- [x] Configure JWT validation in `Program.cs` (issuer, audience, signing key from config)
- [x] Add `[Authorize]` attribute to a test endpoint and verify with Postman/curl
- [x] Store JWT secret in user-secrets for development (never in appsettings)

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

- [x] Create `WorkspacesController`
- [x] On workspace creation, auto-insert a `WorkspaceMember` row with Role = Admin for the creator
- [x] Build a **workspace authorization middleware/filter** that checks membership before allowing access
- [x] Create DTOs (request/response) — never expose entities directly
- [x] Write the member management endpoints with role-based checks
- [x] Add `GET /api/workspaces/{id}/members` endpoint to list all members in a workspace

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

- [x] Create `ProjectsController` and `TasksController`
- [x] For task creation, auto-assign `Position` as max + 1 within the target status column
- [x] For `/move`, accept `{ newStatus, newPosition }` and reorder affected tasks in a single transaction
- [x] Ensure all project/task routes validate workspace membership
- [x] Return tasks grouped or ordered by Status + Position for easy frontend consumption

**Key learning:** Positional ordering logic, transactional updates, nested resource authorization.

---

## Phase 5 — Frontend Foundation & Auth Flow

**Goal:** Next.js app with login/register pages and protected routes.

### Steps

- [x] Set up Tailwind CSS (should come with create-next-app)
- [x] Create pages: `/login`, `/register`, `/dashboard`
- [x] Build auth context/provider that stores JWT in memory (not localStorage for security)
- [x] Create API client utility (fetch wrapper that attaches JWT to headers)
- [x] Implement login + register forms that call the backend
- [x] Add route protection: redirect unauthenticated users to `/login`
- [x] Display a basic dashboard listing the user's workspaces

**Key learning:** React context, token management, protected routing in Next.js App Router.

---

## Phase 6 — Kanban Board & Creation UI

**Goal:** The drag-and-drop board — the centerpiece of the app — plus the forms to create workspaces, projects, and tasks from the UI.

### Steps

- [x] Install `@hello-pangea/dnd`
- [x] Build the board layout: three columns (Todo, In Progress, Done)
- [x] Fetch tasks from `GET /api/projects/{id}/tasks` on board load
- [x] Render tasks as draggable cards within their status columns
- [x] On drag-end, **optimistically update local state** immediately
- [x] Fire `PUT /api/tasks/{id}/move` in the background
- [x] On API failure, **roll back** the card to its previous position and show an error toast
- [x] Add "New Workspace" button on the dashboard with inline/modal form
- [x] Add "New Project" button on the workspace detail page with inline/modal form
- [x] Add "New Task" button per board column with an inline form
- [x] Add delete button on task cards 
- [x] Add delete button on project page with confirmation
- [x] Add delete button on workspace page with confirmation

**Key learning:** Optimistic UI updates, drag-and-drop libraries, state rollback patterns, reusable form + POST-to-API patterns.

---

## Phase 7 — Deletion Safeguards & UI Expansion

**Goal:** Prevent accidental data loss for critical entities by adding confirmation friction, and optimize the Kanban board layout to utilize full screen width.

### Steps

- [x] Create a reusable `ConfirmationModal` component (UI popup with "Cancel" and "Confirm" buttons).
- [x] Update Workspace deletion: Clicking "Delete Workspace" opens the modal showing "Are you sure you want to delete [Workspace Name]?".
- [x] Update Project deletion: Clicking "Delete Project" opens the modal showing "Are you sure you want to delete [Project Name]?".
- [x] Wire the "Confirm" button in the modals to execute the actual `DELETE` API calls.
- [x] Refactor the `ProjectBoardPage` layout: Remove the `max-w-6xl` container restriction and replace it with `max-w-full px-4` or `max-w-[1400px]` so the columns expand to fill wasted screen space.
- [x] Adjust the grid layout (`grid-cols-1 md:grid-cols-3`) to ensure columns stretch nicely across the newly available width.

**Key learning:** React portals/modal state management, protecting destructive actions, and fluid responsive layouts in Tailwind.

---

## Phase 8 — Task Assignment

**Goal:** Enable teamwork by assigning tasks to specific workspace members and displaying who is working on what on the board.

### Steps

- [x] Update the database schema: Add an `AssigneeId` (nullable foreign key) to the `Task` entity, linking it to a `User`.
- [x] Run EF Core migrations and update the database.
- [x] Update the `TasksController` endpoints (`POST` and `PUT`) and DTOs to accept and return assignee data.
- [x] Modify the UI of the Draggable Task Card: Add a small footer section that displays the assignee's name.

**Key learning:** Handling optional foreign keys in EF Core, building UI dropdowns for relational data.

---

## Phase 9 — Workspace Sharing & Member Management UI

**Goal:** Let users invite others to their workspaces so teams can collaborate on boards together. The backend endpoints already exist (Phase 3) — this phase wires up the frontend.

### Steps

- [x] Build a "Members" section on the workspace detail page that lists all current members (name/email).
- [x] Add an "Invite Member" form (email input + role dropdown: Admin, Member, Viewer) that calls `POST /api/workspaces/{id}/members`.
- [x] Add a "Remove" button next to each member (Admin only) that calls `DELETE /api/workspaces/{id}/members/{userId}` with a confirmation modal.
- [x] Show the current user's role in the workspace and hide admin-only actions (invite/remove) for non-admins.
- [x] Handle error states: user not found, user already a member, permission denied.

**Key learning:** Building collaborative features, role-based UI visibility, connecting to existing API endpoints.

---

## Phase 10 — Polish & Portfolio-Ready

**Goal:** Make it presentable and deployable.

- [ ] Add loading skeletons and error states across pages
- [ ] Add workspace switcher in the sidebar/header
- [ ] Responsive design pass (mobile-friendly board)
- [ ] Write a project README with screenshots, tech stack, and architecture diagram
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
7. **Keep it short** — only one sentence or around 10 words max.

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

