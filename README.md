# Digital Butler

A workspace-based Kanban project management app — built as a portfolio piece to learn full-stack development end-to-end.

Organize work into **workspaces** (teams/companies), containing **projects** (boards), filled with **tasks** you can drag across `Todo → In Progress → Done` columns.

## Tech Stack

| Layer        | Technology                                       |
| ------------ | ------------------------------------------------ |
| Frontend     | Next.js (React), Tailwind CSS, @hello-pangea/dnd |
| Backend API  | C# ASP.NET Core Web API                          |
| Data Access  | Entity Framework Core                            |
| Database     | PostgreSQL                                       |
| Auth         | JWT (access tokens)                              |


## Features

**Implemented (backend):**

- JWT-based authentication with BCrypt password hashing
- Multi-tenant workspaces with role-based access (Admin / Member / Viewer)
- Workspace membership management
- Projects scoped to workspaces
- Full task CRUD with auto-positioning
- Drag-and-drop move endpoint with transactional reorder of neighboring tasks

**Planned (frontend):**

- Login / register / dashboard pages
- Workspace switcher
- Interactive Kanban board with drag-and-drop
- Optimistic UI updates with rollback on failure
- 

## Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- [PostgreSQL 15+](https://www.postgresql.org/download/)

### Backend setup

```bash
cd backend

# Configure the database connection (appsettings.Development.json)
# Example: "Host=localhost;Database=digitalbutler;Username=postgres;Password=postgres"

# Store the JWT signing key in user-secrets (never commit this!)
dotnet user-secrets set "Jwt:Key" "your-long-random-secret-here"

# Apply migrations
dotnet ef database update

# Run the API
dotnet run
```

The API will start at `http://localhost:5071`. Swagger UI is available at `/swagger` for interactive API testing with JWT auth.

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The Next.js app will start at `http://localhost:3000`.

## API Overview

All endpoints except `/api/auth/*` require a `Bearer` JWT in the `Authorization` header.

### Auth

| Method | Route                  | Purpose                          |
| ------ | ---------------------- | -------------------------------- |
| POST   | `/api/auth/register`   | Create user, return JWT          |
| POST   | `/api/auth/login`      | Validate credentials, return JWT |

### Workspaces

| Method | Route                                           | Purpose                      |
| ------ | ----------------------------------------------- | ---------------------------- |
| POST   | `/api/workspaces`                               | Create workspace             |
| GET    | `/api/workspaces`                               | List user's workspaces       |
| DELETE | `/api/workspaces/{id}`                          | Delete workspace (Admin)     |
| GET    | `/api/workspaces/{id}/members`                  | List workspace members       |
| POST   | `/api/workspaces/{id}/members`                  | Add member (Admin)           |
| DELETE | `/api/workspaces/{id}/members/{userId}`         | Remove member (Admin)        |

### Projects

| Method | Route                                           | Purpose                      |
| ------ | ----------------------------------------------- | ---------------------------- |
| GET    | `/api/workspaces/{workspaceId}/projects`        | List projects in workspace   |
| POST   | `/api/workspaces/{workspaceId}/projects`        | Create project               |
| DELETE | `/api/workspaces/{workspaceId}/projects/{id}`   | Delete project (Admin)       |

### Tasks

| Method | Route                                 | Purpose                              |
| ------ | ------------------------------------- | ------------------------------------ |
| GET    | `/api/projects/{projectId}/tasks`     | Get tasks for a project              |
| POST   | `/api/projects/{projectId}/tasks`     | Create a task                        |
| PUT    | `/api/tasks/{taskId}`                 | Update task title/description        |
| PUT    | `/api/tasks/{taskId}/move`            | Update status + position (drag/drop) |
| DELETE | `/api/tasks/{taskId}`                 | Delete a task                        |

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/). See [CLAUDE.md](CLAUDE.md#git-commit-message-convention) for the full format guide.

## License

See [LICENSE](LICENSE).
