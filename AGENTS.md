# LesanSatek - Full-Stack Application

## Project Overview
LesanSatek is a full-stack web application built with a Deno backend (Lesan framework) and Next.js frontend. It is an organizational process management system that allows organizations to define and manage their purchasing processes through a visual process builder. Each organization can create departments, assign responsible employees, and build hierarchical unit structures (organization → department → employee → units/subunits in a tree). The system provides a flexible workflow engine for defining, approving, and executing purchasing workflows.

### Architecture
- **Backend**: Deno + Lesan framework (MongoDB-based ODM/ORM)
- **Frontend**: Next.js (latest) + latest React + TypeScript + Tailwind CSS + shadcn/ui + next-intl
- **Database**: MongoDB
- **Caching/Session**: Redis (if needed in dev)
- **Containerization**: Docker + Docker Compose

### Core Technologies
- **Backend**: Deno, Lesan framework, MongoDB
- **Frontend**: Next.js (latest) + latest React + TypeScript + Tailwind CSS + shadcn/ui + next-intl
- **UI Components**: shadcn/ui (Radix UI based), Tailwind CSS
- **Authentication**: JWT-based with jose library
- **Internationalization**: next-intl
- **Form Handling**: React Hook Form + Zod
- **State Management**: Zustand

## Key Features

### Backend (Lesan Framework)
- Schema-based data modeling with validation using Zod-like syntax
- Automatic API generation with playground interface
- MongoDB ODM with relationship management
- CORS support for frontend integration
- File upload functionality with static file serving
- Type generation for frontend integration

### Frontend (Next.js)
- Full internationalization with **nine languages** (fa, en, ar, zh, pt, es, nl, tr, ru) including proper RTL support for Persian and Arabic
- Visual process builder for creating and managing purchasing workflows
- Organization management with hierarchical unit tree (organization → department → employee → units/subunits)
- Responsive design with Tailwind CSS + shadcn/ui
- Form handling with React Hook Form and Zod validation
- State management with Zustand

## Project Structure

```
lesanSatek/
├── back/                 # Deno backend
│   ├── models/           # Data models and schemas
│   ├── src/              # Main backend source code
│   ├── declarations/     # Generated type declarations
│   ├── utils/            # Utility functions
│   └── ...
├── front/                # Next.js frontend
│   ├── src/              # Main frontend source code
│   ├── public/           # Static assets
│   ├── i18n/             # Internationalization files
│   └── ...
├── .env.backend          # Backend environment variables
├── .env.frontend         # Frontend environment variables
├── docker-compose.yml    # Production Docker Compose
└── docker-compose.dev.yml # Development Docker Compose
```

## Building and Running

### Development Environment

**Docker-based Development:**
```bash
# For development with live reloading
docker-compose -f docker-compose.dev.yml up --build

# The development setup uses direct port mapping:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:1405
# - MongoDB: localhost:27017
```

**Manual Development:**

Backend (Deno):
```bash
cd back/
deno task bc-dev  # Runs with auto-reload for development
```

Frontend (Next.js):
```bash
cd front/
pnpm dev  # or npm run dev
```

### Production Deployment

**Docker-based Production:**
```bash
docker-compose up --build
```

The production setup exposes:
- Frontend: Port 3005
- Backend: Port 1405

## Environment Configuration

The application uses separate environment files:

- `.env.backend` - Backend-specific environment variables
- `.env.frontend` - Frontend-specific environment variables

## Data Models

The backend defines the following core models:
- **Users** - User authentication and authorization
- **Organizations** - Organizations that own purchasing processes
- **Departments** - Departments within an organization
- **Units** - Hierarchical units/subunits (tree structure) under departments
- **Employees** - Employees responsible for departments/units
- **Processes** - Visual process builder definitions for purchasing workflows
- **Process Steps** - Individual steps within a purchasing process
- **Purchasing Requests** - Actual purchasing requests flowing through processes
- **Files** - File upload management
- **Tags** - Metadata categorization

## Scripting Conventions
- Any ad-hoc scripts (data entry, migration, or automation scripts) **must** be placed in the `ignore-scripts/` folder at the project root.
- This folder is listed in `.gitignore` so scripts are never accidentally committed to the repository.
- Example: `ignore-scripts/_someScript.py` — run from project root via `python3 ignore-scripts/_someScript.py`.

## Development Conventions

### Backend (Deno)
- Uses Lesan framework for API generation and data modeling
- TypeScript with strict typing
- Zod-like validation syntax for schema definitions
- Auto-generated type declarations for frontend integration
- MongoDB ODM with relationship support

### Frontend (Next.js)
- TypeScript throughout
- Tailwind CSS for styling
- shadcn/ui for component library (Radix UI primitives)
- Internationalization with next-intl
- React Hook Form for form handling
- Zustand for state management
- Responsive design patterns

## Key Configuration Files

- `back/deno.json` - Deno project configuration
- `back/mod.ts` - Backend application entry point
- `front/next.config.ts` - Next.js configuration with i18n plugins
- `front/package.json` - Frontend dependencies and scripts
- `docker-compose.yml` - Production Docker configuration
- `docker-compose.dev.yml` - Development Docker configuration

## API Documentation

The backend provides an API playground at `/playground` when running in development mode, allowing for interactive API exploration and testing.

## Deployment

The application is designed for containerized deployment using Docker. Both development and production configurations are provided to streamline the deployment process.

## Git commit

When I say `git commit` please do the following:

```
Please act as an expert Git commit assistant. Your task is to carefully review the recent project changes (e.g., via git diff or staged files) and generate a series of clear, conventional commit messages following best practices. Use Gitmoji emojis at the start of each commit message to make them more expressive and readable (e.g., :sparkles: for new features, :bug: for fixes).
Key guidelines:
Conventional structure: Each commit message should start with a Gitmoji, followed by a type (e.g., feat, fix, refactor, docs, test, chore), a scope in parentheses if applicable (e.g., (ui)), a colon, and a concise description. Include a body if needed for more details, and reference issues if relevant.
Grouping: Break changes into logical, atomic commits. Group related files or changes together (e.g., one commit for UI updates, another for bug fixes), rather than lumping everything into a single commit. Avoid overly large or unrelated groupings.
Execution: Directly output and execute the necessary Git shell commands (e.g., git add for specific files, followed by git commit -m "message") to apply these commits. Do not ask for confirmation, additional input, or perform unrelated actions like rebasing, squashing, or amending existing commits. Only create new commits on the current branch.
Best practices: Ensure messages are imperative, concise (50 chars for subject), and descriptive. Focus on what changed and why, not how.
Additional notes:
- Use present tense for the subject line (e.g., "Add feature" not "Added feature")
- Be specific about what was changed (e.g., "Fix user login validation" rather than just "Fix bug")
- When making breaking changes, indicate this with an exclamation mark after the type (e.g., "feat!: Remove deprecated API endpoint")
- Reference issue numbers if applicable (e.g., "fix(auth): Resolve login issue #123")
- For multiple related changes, create separate commits for each logical change
- When updating dependencies, mention the specific packages (e.g., "chore(deps): Update react and react-dom to v18")
- For documentation changes, be clear about what documentation was added or updated
- When changing configuration files, explain the purpose of the changes
Proceed step-by-step: First, analyze the changes, then propose the grouped commits, and finally execute the Git commands in sequence.
```

⚠️ **WARNING**: Under no circumstances should you ever use the `git reset` command when performing git operations, as it can permanently erase work that took days to complete. This command has caused significant data loss in the past and should be avoided entirely.
