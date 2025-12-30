# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.





---

# Session-Based Authentication for React Dashboard

## Overview
This React frontend uses **session-based authentication** instead of OAuth2 tokens. This approach:
- Requires zero post-install configuration
- Mirrors OpenEMR's existing PHP session system
- Enables plug-and-play installation for mental health clinics
- Eliminates the need for OAuth client management

## Custom Authentication Endpoints

Three custom PHP endpoints handle authentication:

### 1. Login: `/custom/api/session_login.php`
- Accepts JSON POST with `username` and `password`
- Authenticates using OpenEMR's `AuthUtils`
- Creates a PHP session (using OpenEMR's session management)
- Returns user details including name, role, and admin status

**Example Request:**
```json
POST /custom/api/session_login.php
{
  "username": "admin",
  "password": "password"
}
```

**Example Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "fname": "Administrator",
    "lname": "Administrator",
    "fullName": "Administrator Administrator",
    "authorized": 1,
    "admin": true
  }
}
```

### 2. User Info: `/custom/api/session_user.php`
- Returns current user details from active session
- Used to verify session validity
- Updates cached user information

### 3. Logout: `/custom/api/session_logout.php`
- Destroys the PHP session
- Logs the logout event
- Clears authentication state

## How It Works

1. **Login Flow:**
   - User submits credentials via React login form
   - `session_login.php` authenticates and creates session
   - Session cookie is set (handled by OpenEMR's SessionUtil)
   - User info is stored in localStorage for quick access
   - React app navigates to dashboard

2. **Authenticated Requests:**
   - All API requests include `credentials: 'include'`
   - Session cookie is automatically sent with each request
   - OpenEMR validates session via standard PHP session handling

3. **Session Validation:**
   - Dashboard checks localStorage for user data
   - Calls `session_user.php` to verify session is still valid
   - Redirects to login if session expired

4. **Logout Flow:**
   - User clicks Sign Out
   - `session_logout.php` destroys session
   - localStorage is cleared
   - User is redirected to login page

## Security Features

- **CSRF Protection:** Uses OpenEMR's built-in CSRF utilities
- **Session Management:** Leverages OpenEMR's SessionUtil class
- **Audit Logging:** All login/logout events logged via EventAuditLogger
- **CORS:** Properly configured for React app origin
- **Credentials:** Session cookies are httpOnly and secure (HTTPS only)

## Benefits Over OAuth2

1. **Zero Configuration:** No OAuth client setup required
2. **Simpler Deployment:** Works immediately after installation
3. **Native Integration:** Uses OpenEMR's existing session infrastructure
4. **Better for Self-Hosted:** Ideal for single-installation EMR systems
5. **Familiar to Developers:** Standard PHP session patterns

## File Locations

```
openemr/custom/api/
├── session_login.php      # Login endpoint
├── session_user.php       # User info endpoint
└── session_logout.php     # Logout endpoint
```

These files are intentionally placed in `/custom/api/` to:
- Keep them separate from OpenEMR core
- Ensure they persist across OpenEMR upgrades
- Make them easily accessible to the React frontend
- Follow OpenEMR's customization best practices