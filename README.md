# crm-manager-web — Platform Administration Console

> **Stack:** React 19 · Vite 8 · TypeScript 6 · TailwindCSS 4 · React Query · Framer Motion  
> **Port:** 4201 (Nginx)  
> **Purpose:** Internal web UI for platform administrators to manage tenants, users, permissions, and system settings  
> **Access:** SUPER_ADMIN platform role required (enforced by `crm-manager-api`)

---

## Quick Start

```bash
cp .env.example .env
npm install
npm run dev
# App: http://localhost:5173
# API proxy: /api → crm-manager-api (port 3001)
```

---

## Pages & Routes

| Route | Component | Access | Description |
|---|---|---|---|
| `/` | `DashboardPage` | All admins | Platform overview: total tenants, active users, storage usage, system health |
| `/tenants` | `TenantsPage` | All admins | List all tenants with status filter |
| `/tenants/:id` | `TenantDetailPage` | All admins | Tenant detail: subscription, feature permissions, custom domain, backups, webhooks |
| `/permission-groups` | `PermissionGroupsPage` | All admins | Manage permission templates and apply them to tenants |
| `/users` | `ManagerUsersPage` | All admins | Platform-level user management |
| `/onboarding` | `CustomerOnboardingPage` | All admins | Provision new tenants with step-by-step wizard |
| `/audit-logs` | `AuditLogPage` | All admins | Platform audit trail with filters |
| `/system-settings` | `SystemSettingsPage` | **SUPER_ADMIN only** | Maintenance mode, emergency banner |

---

## Authentication

Uses the **same cookie-based session** as `crm-manager-api` (sid cookie over `withCredentials: true`).

**Login flow:**
```
1. App calls GET /api/auth/me on load
2. If 401 → show LoginScreen
3. LoginScreen redirects to GET /api/auth/login?returnTo=...
   → crm-manager-api handles Keycloak OAuth
4. After auth: sid cookie is set, app reloads with user context
```

**Auto token refresh:**
- Axios interceptor catches 401 responses
- Calls `GET /api/auth/refresh` to silently refresh the token
- Retries original request
- If refresh fails → dispatches `crm-manager-auth:logout` custom event → clears UI

---

## Feature Modules

### Dashboard (`/`)

Displays real-time platform health from `GET /api/analytics/dashboard`:
- Total tenants count
- Active users (across all tenants)
- Total storage used (MB)
- System health status (`healthy` / `degraded` / `down`)

### Tenant Management (`/tenants`, `/tenants/:id`)

**Tenants list:**
- Filter by status: `active`, `suspended`, `cancelled`
- Quick actions: view detail, suspend/activate

**Tenant detail tabs:**
- **Overview** — name, alias, plan, status, dates
- **Subscription** — change plan (`FREE`/`PRO`/`ENTERPRISE`), storage quota
- **Feature Permissions** — grant/revoke specific feature-tier permissions per tenant
- **Core Permissions** — disable specific CORE permissions (advanced, use with caution)
- **Custom Domain** — configure, verify DNS records, track SSL status
- **Backups** — create on-demand backup, view history, restore with alias confirmation
- **Webhooks** — view webhook stats (success rate, delivery count), inspect delivery logs, resend failed deliveries

### Permission Groups (`/permission-groups`)

Templates of permission sets that can be bulk-applied to multiple tenants:

```
PermissionGroup {
  name: string
  description: string
  permissions: string[]   // e.g. ['campaigns:view', 'ai_video:create']
}
```

**Actions:**
- Create / edit / delete permission groups
- Apply a group to selected tenants (`replace` mode — full replace, or `merge` mode — add on top)
- View permission catalog (`GET /api/permission-groups/catalog`) to browse all available permissions

### Customer Onboarding (`/onboarding`)

Step-by-step provisioning wizard:
```
Step 1: Enter company name, admin email, admin full name, plan
Step 2: POST /api/onboarding/provision → returns provisioningId
Step 3: Poll GET /api/onboarding/status/:id every 2s
        → { status, currentStep, totalSteps, stepLabel, subStepLogs }
Step 4: On READY → display tenant URL + option to invite more users
Step 5: POST /api/onboarding/tenants/:tenantId/invite → invite additional users
```

**Retry on failure:** `POST /api/onboarding/status/:id/retry`

### Platform Users (`/users`)

Manage platform-level administrator accounts:
- List all manager users
- Create new user (creates in Keycloak + sends invite email)
- Enable/disable user status
- Fields: email, name, Keycloak ID, platform role, account status

### Audit Logs (`/audit-logs`)

Full audit trail with filters:
- Filter by: `action`, `targetType`, `targetId`, `actorId`, date range `from`/`to`
- Paginated display (page, limit)
- Each entry: actor email, IP, user agent, action, before/after diff, metadata

### System Settings (`/system-settings`) — SUPER_ADMIN only

**Maintenance Mode:**
- Enable/disable platform-wide maintenance
- Whitelist specific IPs to bypass maintenance
- Shows: enabled timestamp, enabled by (admin name)

**Emergency Banner:**
- Show a warning banner to all users
- Title, message, color (`yellow` / `red`)
- Enable/disable in real-time

---

## API Client (`src/api.ts`)

All backend calls go through `axios` with:
- `baseURL: VITE_API_BASE_URL` (default: `/api` → proxied to crm-manager-api)
- `withCredentials: true` — sends sid cookie on every request
- Auto-retry on 401 with token refresh

**Key API functions:**

| Function | Endpoint | Description |
|---|---|---|
| `fetchCurrentUser()` | `GET /auth/me` | Auth check on app load |
| `fetchTenants()` | `GET /tenants` | List all tenants |
| `fetchTenantById(id)` | `GET /tenants/:id` | Tenant detail |
| `updateTenantStatus(id, status)` | `PATCH /tenants/:id/status` | Suspend/activate |
| `updateTenantSubscription(id, data)` | `PATCH /tenants/:id/subscription` | Change plan/quota |
| `fetchFeaturePermissions(id)` | `GET /tenants/:id/feature-permissions` | Get permission state |
| `setFeaturePermissions(id, perms)` | `PUT /tenants/:id/feature-permissions` | Full replace |
| `grantFeaturePermissions(id, perms)` | `POST /tenants/:id/feature-permissions/grant` | Additive grant |
| `revokeFeaturePermissions(id, perms)` | `DELETE /tenants/:id/feature-permissions/revoke` | Revoke |
| `setCorePermissions(id, perms)` | `PUT /tenants/:id/core-permissions` | Override core perms |
| `fetchCustomDomain(id)` | `GET /tenants/:id/custom-domain` | Custom domain status |
| `setCustomDomain(id, domain)` | `PUT /tenants/:id/custom-domain` | Set domain |
| `verifyCustomDomain(id)` | `POST /tenants/:id/custom-domain/verify` | Trigger DNS verify |
| `createBackup(id)` | `POST /tenants/:id/backups` | On-demand backup |
| `restoreBackup(id, backupId, alias)` | `POST /tenants/:id/backups/:backupId/restore` | Restore (requires alias confirmation) |
| `fetchWebhookStats(id)` | `GET /tenants/:id/webhooks/stats` | Webhook delivery stats |
| `resendWebhookDelivery(id, delivId)` | `POST /tenants/:id/webhooks/:delivId/resend` | Retry failed delivery |
| `provisionCustomer(data)` | `POST /onboarding/provision` | Start provisioning |
| `fetchProvisioningStatus(id)` | `GET /onboarding/status/:id` | Poll provisioning |
| `retryProvisioning(id)` | `POST /onboarding/status/:id/retry` | Retry failed provision |
| `fetchDashboardStats()` | `GET /analytics/dashboard` | Platform KPIs |
| `fetchAuditLogs(params)` | `GET /audit-logs` | Platform audit trail |
| `fetchSystemSettings()` | `GET /system-settings` | Read system config |
| `toggleMaintenance(enabled, ips)` | `PATCH /system-settings/maintenance` | Toggle maintenance mode |
| `updateEmergencyBanner(data)` | `PATCH /system-settings/emergency-banner` | Update emergency banner |

---

## Project Structure

```
src/
├── App.tsx                  # Auth check, login screen, route definitions
├── api.ts                   # All API calls + TypeScript types
├── main.tsx                 # Entry point
├── index.css                # TailwindCSS 4 global styles + design tokens
├── features/
│   ├── dashboard/           # Dashboard widgets
│   └── tenants/             # Tenant feature components
├── pages/
│   ├── DashboardPage.tsx
│   ├── TenantsPage.tsx
│   ├── TenantDetailPage.tsx     # Multi-tab tenant management
│   ├── PermissionGroupsPage.tsx
│   ├── ManagerUsersPage.tsx
│   ├── CustomerOnboardingPage.tsx
│   ├── AuditLogPage.tsx
│   └── SystemSettingsPage.tsx   # SUPER_ADMIN only
├── shared/
│   ├── context/
│   │   └── ToastContext.tsx     # Global toast notifications
│   └── layouts/
│       └── AdminLayout.tsx      # Sidebar + nav shell
└── hooks/                   # Shared React hooks
```

---

## Tech Stack Details

| Library | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | Build tool + dev server |
| TypeScript | 6 | Type safety |
| TailwindCSS | 4 | Utility-first styling (via `@tailwindcss/vite` plugin) |
| React Router | 7 | Client-side routing |
| TanStack React Query | 5 | Data fetching, caching, background refresh |
| Axios | 1.x | HTTP client with interceptors |
| Framer Motion | 12 | Page/component animations |
| Lucide React | 1.x | Icon library |
| i18next + react-i18next | 26/17 | Internationalization (future use) |
| socket.io-client | 4 | Real-time updates (future use) |

---

## Environment Variables

```bash
# .env (copied from .env.example)
VITE_API_BASE_URL=/api                          # API base URL (proxied to crm-manager-api)
VITE_DISASTER_RECOVERY_FEATURE_ENABLED=false    # Show/hide Disaster Recovery UI tab
```

---

## Docker Deployment

Multi-stage build: Node.js build → Nginx static serve

```bash
# Build and run
docker-compose up -d --build

# Manually
docker build -t crm-manager-web .
docker run -p 4201:4201 crm-manager-web
```

**Nginx configuration** (`nginx.conf`):
- Serves static files on port `4201`
- Proxies `/api/*` → `http://crm-manager-api:3001/api/` (avoids CORS, shares cookie domain)
- SPA fallback: all unknown routes → `index.html`

---

## Development Commands

```bash
npm run dev        # Start dev server (http://localhost:5173)
npm run build      # TypeScript check + Vite production build → dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint
```
