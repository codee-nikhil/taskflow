# ⚡ TaskFlow — Team Task Manager

A full-stack team collaboration and task management app with role-based access control.

**Live Demo:** `https://your-app.railway.app`  
**GitHub:** `https://github.com/your-username/taskflow`

---

## 🚀 Features

- **Authentication** — JWT-based signup/login with secure password hashing
- **Role-Based Access Control** — Admin vs Member roles at global and project levels
- **Project Management** — Create, manage, archive, and delete projects with color coding
- **Team Management** — Add/remove members per project, assign project roles
- **Task Tracking** — Kanban board + list view with drag-free status management
- **Task Details** — Priorities (low/medium/high/critical), due dates, assignees, descriptions
- **Comments** — Per-task comment threads
- **Dashboard** — Live stats, overdue alerts, recent activity
- **Overdue Detection** — Automatic flagging of past-due tasks
- **Admin Panel** — Manage all users and their global roles

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Vite |
| Backend | Node.js, Express.js |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT + bcryptjs |
| Deployment | Railway |

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── models/
│   │   └── db.js           # SQLite schema + initialization
│   ├── middleware/
│   │   └── auth.js         # JWT auth + role guards
│   ├── routes/
│   │   ├── auth.js         # POST /signup, /login, GET /me
│   │   ├── projects.js     # CRUD + member management
│   │   ├── tasks.js        # CRUD + comments
│   │   └── users.js        # Admin user management + dashboard stats
│   └── server.js           # Express app entry point
├── frontend/
│   └── src/
│       ├── contexts/
│       │   └── AuthContext.jsx
│       ├── components/
│       │   └── Layout.jsx
│       ├── pages/
│       │   ├── AuthPage.jsx      # Login + Signup
│       │   ├── Dashboard.jsx     # Stats + recent/overdue
│       │   ├── Projects.jsx      # Project list + create
│       │   ├── ProjectDetail.jsx # Kanban + list + members
│       │   ├── TasksPage.jsx     # My tasks with filters
│       │   └── AdminPage.jsx     # User management
│       ├── api.js            # Fetch wrapper with JWT
│       ├── App.jsx           # Router + protected routes
│       └── index.css         # Design system + components
├── railway.toml
└── package.json
```

---

## 🗄 Database Schema

```sql
users          — id, name, email, password, role, avatar_color
projects       — id, name, description, status, color, owner_id
project_members — project_id, user_id, role (admin/member)
tasks          — id, title, description, status, priority, project_id, 
                 assignee_id, creator_id, due_date
comments       — id, task_id, user_id, content
```

---

## 🔐 API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/projects` | ✓ | List accessible projects |
| POST | `/api/projects` | ✓ | Create project |
| GET | `/api/projects/:id` | ✓ Member | Project details + tasks + members |
| PUT | `/api/projects/:id` | ✓ Admin | Update project |
| DELETE | `/api/projects/:id` | ✓ Owner | Delete project |
| POST | `/api/projects/:id/members` | ✓ Admin | Add member |
| DELETE | `/api/projects/:id/members/:uid` | ✓ Admin | Remove member |

### Tasks
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tasks` | ✓ | List tasks with filters |
| POST | `/api/tasks` | ✓ Member | Create task |
| GET | `/api/tasks/:id` | ✓ | Task + comments |
| PUT | `/api/tasks/:id` | ✓ | Update task |
| DELETE | `/api/tasks/:id` | ✓ Creator/Admin | Delete task |
| POST | `/api/tasks/:id/comments` | ✓ | Add comment |

### Users (Admin only)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/search?q=` | Search users |
| PUT | `/api/users/:id/role` | Update user role |
| GET | `/api/users/stats` | Dashboard statistics |

---

## 🏃 Running Locally

```bash
# Clone the repo
git clone https://github.com/your-username/taskflow
cd taskflow

# Install all dependencies
npm run install:all

# Start backend (port 3001)
npm run dev:backend

# In another terminal, start frontend (port 5173)
npm run dev:frontend
```

Open `http://localhost:5173` — the frontend proxies API calls to `:3001`.

---

## 🌐 Deploy to Railway

### 1. Create a Railway account
Go to [railway.app](https://railway.app) and sign up.

### 2. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/taskflow.git
git push -u origin main
```

### 3. Create Railway project
- Click **"New Project"** → **"Deploy from GitHub repo"**
- Select your `taskflow` repository

### 4. Set environment variables
In Railway dashboard → Variables:
```
JWT_SECRET=your-super-secret-production-key-minimum-32-chars
NODE_ENV=production
PORT=3001
```

### 5. Deploy
Railway auto-detects `railway.toml` and runs:
- Build: `npm run railway:build`
- Start: `npm run railway:start`

The SQLite database persists in Railway's filesystem via the `DB_PATH` env var (or defaults to `./taskflow.db`).

---

## 🎨 Role Reference

| Permission | Member | Project Admin | Global Admin |
|-----------|--------|---------------|-------------|
| Create projects | ✓ | ✓ | ✓ |
| View assigned projects | ✓ | ✓ | ✓ |
| View all projects | ✗ | ✗ | ✓ |
| Create tasks | ✓ | ✓ | ✓ |
| Delete own tasks | ✓ | ✓ | ✓ |
| Delete any task | ✗ | ✓ | ✓ |
| Add project members | ✗ | ✓ | ✓ |
| Manage user roles | ✗ | ✗ | ✓ |

---

## 📝 Validations

- Email must be valid and unique
- Password minimum 6 characters
- Task/project names required and non-empty
- Due dates must be ISO 8601 format
- Status/priority values validated against allowed enums
- Foreign key constraints enforced at DB level

---

Built with ⚡ by Nikhil Tiwari
