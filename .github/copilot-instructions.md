# Copilot Instructions for RoadScan Project

## Critical Rules

### 1. NEVER Change Directory in Terminal Commands
**ALWAYS stay in the project root directory (`/Users/bradleymonk/Documents/code/git/roadscan`).**

- ❌ WRONG: `cd mobile && npm install`
- ✅ CORRECT: `npm install --prefix mobile`

- ❌ WRONG: `cd backend && npm start`
- ✅ CORRECT: `npm start --prefix backend`

When running commands that need to execute in a subdirectory, use one of these approaches:
- Use `--prefix` flag for npm commands
- Use full paths: `node mobile/scripts/setup.js`
- Use single-line commands with `&&` that return: `(cd mobile && npm install && cd ..)`
- Specify working directory in the command: `npm --prefix mobile install`

**Rationale:** Changing directories causes state issues where subsequent commands fail or execute in the wrong location.

---

## Project Structure Rules

### Mobile App (React Native/Expo)
- Location: `/mobile/`
- Commands: Always use `npm --prefix mobile` or full paths
- Entry point: `mobile/App.tsx`

### Backend (Supabase/Node.js)
- Location: `/backend/`
- Commands: Always use `npm --prefix backend` or full paths

### Admin Dashboard
- Location: `/admin-dashboard/`
- Commands: Always use `npm --prefix admin-dashboard` or full paths

---

## Development Workflow

### Installing Dependencies
```bash
# From root - CORRECT
npm install --prefix mobile
npm install --prefix backend
npm install --prefix admin-dashboard

# NEVER do this
cd mobile && npm install  # ❌ WRONG
```

### Running Development Servers
```bash
# From root - CORRECT
npm start --prefix mobile
npm run dev --prefix backend
npm run dev --prefix admin-dashboard

# Or use npx with full paths
npx --prefix mobile expo start
```

### Running Scripts
```bash
# From root - CORRECT
node mobile/scripts/setup.js
npm run build --prefix mobile

# NEVER do this
cd mobile && npm run build  # ❌ WRONG
```

---

## Python Environment Rules

### If Python is Used
- Always activate virtual environment if present: `source .venv/bin/activate` or equivalent
- Never use `python3` command - use `python` to ensure virtual environment python is used
- Check for virtual environment before running Python commands

---

## Testing and Debugging

### Before Troubleshooting
1. Verify current working directory is project root
2. Check if any background processes need to be killed (servers, watchers)
3. Always confirm with user that changes work before proceeding

### Port Conflicts
- Kill existing processes before starting new servers
- Check for restart scripts (e.g., `./restart.sh`) and use them when available

---

## Git and Version Control

### Committing Changes
- Run git commands from project root
- Never commit `node_modules/`, build artifacts, or environment files
- Check `.gitignore` before committing

---

## Communication with User

### Always:
- Confirm successful completion of tasks
- Ask user to verify app functionality after changes
- Alert user to check browser/terminal logs when debugging
- Be aware of potential code duplication - check existing code first

### Never:
- Use VS Code simple browser for testing (user preference)
- Suggest x86_64 packages (system is arm64 architecture)
- Attempt to build/test mobile app yourself - user will test via run scripts

---

## Architecture-Specific Notes

- System: macOS with **arm64 architecture**
- Install arm64-compatible packages only
- Avoid x86_64/intel-specific dependencies

---

## File Operations

### Creating Files
- Use absolute paths
- Only create essential files
- Avoid unnecessary file creation

### Editing Files
- Include 3-5 lines of context before/after changes
- Use multi_replace for multiple edits when possible
- Read sufficient context before editing

---

## Error Handling

When errors occur:
1. Stay in root directory
2. Read error messages carefully
3. Check file paths are correct (relative to root)
4. Verify dependencies are installed
5. Check for port conflicts or running processes
6. Ask user to check application logs if needed
