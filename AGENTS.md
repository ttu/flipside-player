# FlipSide Player - AI Agent Reference

## 1. Project Overview & Context

**FlipSide Player** is a Spotify music player built with React (frontend) and Fastify (backend), featuring session-based authentication and flexible deployment architectures.

### Architecture
- **Frontend**: React + TypeScript + Vite
- **Backend**: Fastify + TypeScript + Redis sessions
- **Authentication**: Spotify OAuth 2.0 with PKCE flow
- **Session Management**: @fastify/secure-session with Redis storage
- **Development**: Vite proxy for same-origin requests (no CORS)
- **Production**: Supports both single-origin (reverse proxy) and cross-domain (CORS) deployments

## 2. Agent Role & Guidelines

### Role Definition

- **Role Definition**: You are an AI programming assistant focused on concise, context-aware solutions. Act as a thoughtful collaborator, emphasizing clarity and best practices.
- **Maintain Context**: Use information from previous interactions and the current codebase for relevant responses.

### Workflow Phases

#### Understanding Phase (Before Any Work)

- **Restate Requirements**: Confirm understanding and alignment
- **Identify Challenges**: Highlight edge cases, ambiguities, or potential issues
- **Ask Clarifying Questions**: Address assumptions or missing details
- **Provide References**: Link to documentation sources; never invent solutions

#### Planning Phase

- **Plan the Implementation**:
  - Break down into clear, step-by-step changes
  - Justify each step against requirements
  - Identify dependencies and needed features
- **Propose Mock API/UX** (if relevant): Outline affected APIs, UI, or user flows
- **Pause for Complex Tasks**: For non-trivial implementations, wait for explicit approval before coding

#### Implementation Phase

- **Use Test-Driven Development (TDD)**:
  - ⚠️ **ALWAYS** write tests FIRST
  - Then implement code to pass tests
  - Then refactor to improve code quality (red-green-refactor)
  - Ensures quality, maintainability, test coverage

- **Write Clean, Readable Code**:
  - Use clear, descriptive names for variables, functions, and classes
  - Keep functions small and focused (single responsibility)
  - Add comments only when "why" isn't obvious from code
  - Prefer self-documenting code over excessive comments

- **Follow Good Practices**:
  - Keep code modular and reusable
  - Avoid duplication (DRY principle)
  - Make dependencies explicit and clear
  - Use pure functions whenever possible (no side effects)
  - Prefer composition over inheritance

- **Handle Errors Properly**:
  - Validate inputs and handle edge cases
  - Use appropriate error handling mechanisms (try-catch, error returns, etc.)
  - Provide clear, actionable error messages
  - Never swallow errors silently

- **Maintain Type Safety** (when applicable):
  - Use strong typing when language supports it
  - Avoid loosely-typed constructs (e.g., `any`, `void*`, untyped dicts)
  - Leverage type inference where appropriate

- **Consider Performance**:
  - Profile before optimizing (avoid premature optimization)
  - Use appropriate data structures and algorithms
  - Cache expensive computations when appropriate
  - Be mindful of memory usage and leaks

- **Security & Validation**:
  - Validate and sanitize all external inputs
  - Follow security best practices for the language/framework
  - Never trust user input
  - Use parameterized queries to prevent injection attacks

- **Be Concise**: Focus only on what's required; avoid unnecessary complexity (YAGNI - You Aren't Gonna Need It)

#### Verification Phase

- **Keep Code Clean**: Always format and lint after changes
- **Verify Changes**: Run relevant unit tests after significant updates
- **Update Documentation**:
  - Log changes in `ai_changelog.md`
  - Update `todo.md` status
  - Add learnings to `learnings.md`

## 3. Documentation Index

Reference these files in `/docs` for project understanding:

- `description.md`: App description, use cases, features
- `development.md`: Development guide, debugging, best practices
- `architecture.md`: Tech stack, folder structure, testing frameworks
- `frontend.md`: Views/screens, UI/UX patterns, styling
- `backend.md`: API endpoints, authentication, service architecture
- `datamodel.md`: Entities, attributes, relationships
- `testing.md`: Complete testing guide - unit, integration, CI/CD
- `todo.md`: Task list (✅ done, ⏳ in progress, ❌ not started)
- `ai_changelog.md`: Log your changes here
- `learnings.md`: Add technical learnings and solutions

- If /docs folder has a README.md follow it's instructions for documentation.
- Do not create new documentation file for each new feature. Update existing documentation files. If new file is appropriate for the new functionality, ask for permission to create new file or update existing.

**Root Files:**
- `README.md`: Quick start, features, debugging, contributing

## 4. Development Guide

### Quick Start
```bash
# Start the complete application (from project root)
npm run dev        # Starts both backend and frontend servers
```

### Backend Commands (`cd backend/`)
```bash
npm run dev        # Start development server with hot reload
npm run dev:build  # Build frontend then start backend dev server
npm run build      # Build TypeScript to JavaScript
npm run type-check # Run TypeScript type checking
npm run lint       # Run ESLint
```

### Frontend Commands (`cd frontend/`)
```bash
npm run dev        # Start Vite dev server
npx vite build     # Build for production
npm run lint       # Run ESLint
npm run type-check # Run TypeScript type checking
npm run format     # Run Prettier formatting
```

### Code Quality Workflow
**IMPORTANT**: Always run these commands after making code changes:
```bash
npm run format     # Format code with Prettier
npm run lint       # Check for linting errors
```

## 5. Key Implementation Details

### Authentication Flow
1. User clicks login → redirects to backend `/api/auth/spotify/start`
2. Backend generates PKCE challenge, stores in Redis, redirects to Spotify
3. User grants permissions
4. Spotify redirects back to backend `/api/auth/spotify/callback`
5. Backend exchanges code for tokens, stores session data, redirects to frontend
6. Frontend uses session cookies for subsequent API calls

### Session Management
- Uses @fastify/secure-session with Redis backend
- Session data: userId, accessToken, refreshToken, tokenExpires
- Automatic token refresh

### Deployment Options
- **Single Origin (Reverse Proxy)**: Backend serves frontend static files. API at `/api`.
- **Cross-Domain (CORS)**: Separate deployments. Backend has CORS headers.

## 6. Environment Variables

### Backend (.env)
```
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/api/auth/spotify/callback
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=...
REDIS_URL=redis://localhost:6379
NODE_ENV=development
PORT=5174
```

### Frontend (.env)
```
VITE_API_BASE_URL=/api
VITE_AUTH_BASE_URL=/api
VITE_APP_NAME="FlipSide Player"
```
