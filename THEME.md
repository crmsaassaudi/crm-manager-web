# CRM Manager Web — Theme & Design System

> **Version**: 1.0 · **Updated**: 2026-06-10
> **Stack**: React 19 · Tailwind CSS v4 · Framer Motion · Lucide React

This document is the single source of truth for the CRM Manager Web visual system.
Every contributor must follow these patterns to maintain consistency across all pages.

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Color System](#color-system)
3. [Typography Scale](#typography-scale)
4. [Spacing & Layout](#spacing--layout)
5. [Component Patterns](#component-patterns)
6. [Icon System](#icon-system)
7. [Animation Guidelines](#animation-guidelines)
8. [Dark Mode](#dark-mode)
9. [i18n Standards](#i18n-standards)
10. [Quick Reference](#quick-reference)

---

## Design Principles

| Principle | Description |
|---|---|
| **Unified Tokens** | Never hardcode colors, sizes, or shadows. Use CSS variables and semantic utility classes from `index.css`. |
| **Semantic Classes** | Use `.text-page-title`, `.card`, `.btn-primary`, `.input-field` instead of ad-hoc Tailwind combinations. |
| **Consistency First** | Every page follows the same header → content → actions layout. No exceptions. |
| **Dark Mode Native** | Every surface, border, and text must work in both light and dark. Use CSS custom properties. |
| **Internationalized** | No user-facing string can be hardcoded. Use `t('key')` from react-i18next. |

---

## Color System

### Primary Palette

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--primary` | `hsl(221.2 83.2% 53.3%)` | `hsl(217.2 91.2% 59.8%)` | Buttons, links, active states |
| `--primary-foreground` | `hsl(210 40% 98%)` | `hsl(222.2 47.4% 11.2%)` | Text on primary backgrounds |

### Surface Tokens

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--surface-page` | `#F8FAFC` | `#020617` | Page background |
| `--surface-card` | `#FFFFFF` | `#0F172A` | Cards, sections, panels |
| `--surface-card-hover` | `#F8FAFC` | `#1E293B` | Card hover state |
| `--surface-input` | `#FFFFFF` | `#0F172A` | Input backgrounds |
| `--surface-muted` | `#F1F5F9` | `#1E293B` | Muted backgrounds (filter bars) |
| `--surface-sidebar` | `#FFFFFF` | `#0F172A` | Sidebar panel |
| `--surface-header` | `rgba(255,255,255,0.8)` | `rgba(15,23,42,0.8)` | Sticky header (blur) |
| `--surface-dropdown` | `#FFFFFF` | `#1E293B` | Dropdown/popover panels |

### Border Tokens

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--border-card` | `#E2E8F0` | `#1E293B` | Card, section borders |
| `--border-input` | `#E2E8F0` | `#1E293B` | Input borders |
| `--border-subtle` | `#F1F5F9` | `rgba(30,41,59,0.5)` | Header, sidebar bottom borders |
| `--border-divider` | `#F1F5F9` | `#1E293B` | Table rows, list separators |

### Text Tokens

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--text-heading` | `#0F172A` | `#F8FAFC` | h1, h2, h3, strong labels |
| `--text-body` | `#475569` | `#94A3B8` | Body text, descriptions |
| `--text-muted` | `#94A3B8` | `#64748B` | Subtitles, placeholders |
| `--text-label` | `#94A3B8` | `#64748B` | Form labels, table headers |

### Semantic Status Colors

| Token | Value | Usage |
|---|---|---|
| `--success` | `hsl(142.1 70.6% 45.3%)` | Active, success states |
| `--warning` | `hsl(37.9 97.2% 53.9%)` | Warning, maintenance |
| `--danger` | `hsl(0 84.2% 60.2%)` | Error, destructive |
| `--info` | `hsl(199 89% 48%)` | Informational |

### Shadow Tokens

| Token | Usage |
|---|---|
| `--shadow-card` | Default card shadow (subtle) |
| `--shadow-card-hover` | Card hover elevation |
| `--shadow-dropdown` | Dropdown/popover shadow |
| `--shadow-primary-glow` | Primary button glow |

---

## Typography Scale

All typography is powered by semantic utility classes. **Never use ad-hoc `text-[Xpx] font-Y` combinations for structural elements.**

| Class | Size | Weight | Case | Usage |
|---|---|---|---|---|
| `.text-page-title` | `text-2xl` (24px) | `font-bold` (700) | Normal | Page `<h1>` |
| `.text-page-subtitle` | `text-[13px]` | `font-medium` (500) | Normal | Below page title |
| `.text-section-title` | `text-base` (16px) | `font-bold` (700) | Normal | Card headers `<h2>/<h3>` |
| `.text-section-desc` | `text-[12px]` | `font-normal` (400) | Normal | Card descriptions |
| `.text-body` | `text-[13px]` | `font-normal` (400) | Normal | Body paragraphs |
| `.text-body-sm` | `text-[12px]` | `font-normal` (400) | Normal | Smaller body text |
| `.text-caption` | `text-[11px]` | `font-medium` (500) | Normal | Timestamps, meta |
| `.text-label` | `text-[11px]` | `font-bold` (700) | UPPERCASE | Form labels, table headers |
| `.text-badge` | `text-[11px]` | `font-bold` (700) | Context | Badge/tag text |
| `.text-stat` | `text-2xl` (24px) | `font-bold` (700) | Normal | Dashboard metric values |

### Usage Examples

```tsx
{/* Page Header — every page */}
<h1 className="text-page-title">{t('tenants.title')}</h1>
<p className="text-page-subtitle">{t('tenants.subtitle')}</p>

{/* Section Header — inside cards */}
<h2 className="text-section-title">{t('...')}</h2>
<p className="text-section-desc">{t('...')}</p>

{/* Form Label */}
<label className="text-label">{t('...')}</label>

{/* Dashboard Number */}
<h3 className="text-stat">{value}</h3>
```

### Font Family

- **Primary**: Inter (400, 500, 600, 700)
- **Mono**: System mono stack (terminal, code, IDs)
- Loaded via `<link>` tag in `index.html` with `font-display: swap`

---

## Spacing & Layout

### Page Structure

```
┌─────────────────────────────────────────────┐
│  AdminLayout                                 │
│  ┌─────┬───────────────────────────────────┐ │
│  │ Side│  Header (sticky, blur)            │ │
│  │ bar │───────────────────────────────────│ │
│  │     │  Content Area (p-4 sm:p-6)        │ │
│  │     │  ┌── page-container ────────────┐ │ │
│  │     │  │  page-header                 │ │ │
│  │     │  │  ┌── card ─────────────────┐ │ │ │
│  │     │  │  │  ...                    │ │ │ │
│  │     │  │  └─────────────────────────┘ │ │ │
│  │     │  └──────────────────────────────┘ │ │
│  └─────┴───────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Standard Spacing Values

| Context | Value | Tailwind |
|---|---|---|
| Page content padding | 16px / 24px | `p-4 sm:p-6` |
| Page sections gap | 24px | `space-y-6` |
| Card inner padding | 20px-24px | `p-5` / `p-6` |
| Section inner gap | 20px | `space-y-5` |
| Grid gap (cards) | 16px-24px | `gap-4` / `gap-6` |
| Form fields gap | 12px | `space-y-3` |
| Table cell padding | 16px horiz, 12px vert | `px-4 py-3` |

---

## Component Patterns

### Card

```tsx
{/* Standard Card */}
<div className="card p-6">
  <h2 className="text-section-title">{title}</h2>
  <p className="text-section-desc">{description}</p>
  {/* content */}
</div>

{/* Hoverable Card */}
<div className="card card-hover p-5">
  {/* ... */}
</div>
```

**CSS properties**: `rounded-xl`, 1px border, `var(--shadow-card)`

### Buttons

```tsx
{/* Primary Button */}
<button className="btn-primary px-4 py-2.5 flex items-center gap-1.5">
  <Plus size={16} />
  {t('...')}
</button>

{/* Ghost/Secondary Button */}
<button className="btn-ghost px-4 py-2">
  {t('common.cancel')}
</button>

{/* Icon-only Button */}
<button className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
  <Pencil size={14} />
</button>
```

### Form Inputs

```tsx
{/* Standard Input */}
<input
  className="input-field w-full"
  placeholder={t('...')}
/>

{/* Input with Icon */}
<div className="relative">
  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
  <input className="input-field w-full pl-9" />
</div>

{/* Select */}
<select className="input-field w-full cursor-pointer">
  <option>{t('...')}</option>
</select>

{/* Label */}
<label className="text-label">{t('...')}</label>
```

### Table

```tsx
<div className="card overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <th className="table-header-cell">{t('...')}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        <tr className="table-row">
          <td className="px-4 py-3">{/* ... */}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### Badges & Status

```tsx
{/* Standard Badge */}
<span className="badge bg-primary/10 text-primary">
  {label}
</span>

{/* Status Badge */}
<span className="status-badge status-active">
  {t('common.active')}
</span>
<span className="status-badge status-suspended">
  {t('common.suspended')}
</span>
<span className="status-badge status-pending">
  {t('common.pending')}
</span>
```

### Modal

```tsx
import Modal from '@/shared/components/Modal';

<Modal
  isOpen={isOpen}
  onClose={onClose}
  title={t('...')}
  size="lg"  // 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  footer={
    <>
      <button className="btn-ghost px-4 py-2">{t('common.cancel')}</button>
      <button className="btn-primary px-4 py-2">{t('common.save')}</button>
    </>
  }
>
  {children}
</Modal>
```

### Confirmation Modal

```tsx
import ConfirmationModal from '@/shared/components/ConfirmationModal';

<ConfirmationModal
  isOpen={isOpen}
  onClose={onClose}
  onConfirm={handleConfirm}
  title={t('...')}
  message={t('...')}
  type="danger"  // 'danger' | 'warning' | 'info' | 'success'
  confirmText={t('...')}
  cancelText={t('common.cancel')}
  isConfirming={isPending}
/>
```

### Toast

```tsx
import { useToast } from '@/shared/context/ToastContext';

const { showToast } = useToast();

showToast(t('permissions.saveSuccess'), 'success');
showToast(t('permissions.saveError'), 'error');
showToast(t('systemSettings.maintenance.enableSuccess'), 'warning');
```

### Loading Spinner

```tsx
{/* Page-level loading */}
<div className="loading-center">
  <div className="spinner spinner-md"></div>
</div>

{/* Inline spinner (buttons) */}
<div className="spinner spinner-sm" />
```

### Dropdown / Popover

```tsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      className="dropdown-panel absolute right-0 mt-1.5 w-40 py-1 z-50 overflow-hidden"
    >
      {/* items */}
    </motion.div>
  )}
</AnimatePresence>
```

---

## Icon System

We use **Lucide React** as the sole icon library.

| Context | Size | Example |
|---|---|---|
| Sidebar nav item | `18` | `<LayoutDashboard size={18} />` |
| Header toolbar | `15` | `<Moon size={15} />` |
| Button inline | `14-16` | `<Plus size={16} />` |
| Card header icon | `18-20` | `<Shield size={18} />` |
| Page feature icon | `28-32` | `<Building2 size={28} />` |
| Table inline | `14-15` | `<Pencil size={14} />` |
| Badge inline | `10-12` | `<ShieldCheck size={10} />` |

**Do not** mix icon libraries. If a Lucide equivalent exists, use it.

---

## Animation Guidelines

### Framer Motion Patterns

```tsx
{/* Page-level fade-in-up */}
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: i * 0.05 }}
>

{/* Dropdown / Popover */}
<motion.div
  initial={{ opacity: 0, y: 8, scale: 0.98 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: 8, scale: 0.98 }}
>

{/* Progress bar */}
<motion.div
  initial={{ width: 0 }}
  animate={{ width: `${percentage}%` }}
  transition={{ duration: 1, ease: 'easeOut' }}
>

{/* Sidebar */}
<motion.aside
  animate={{ width: collapsed ? 64 : 220 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>
```

### CSS Transitions

| Property | Duration | Easing |
|---|---|---|
| Colors, backgrounds | `200ms` | `ease` |
| Transform (hover) | `200ms` | `ease` |
| Layout shifts | `300ms` | `ease-in-out` |

Standard: `transition-colors`, `transition-all`, `transition-transform`

---

## Dark Mode

Dark mode is controlled via `ThemeContext` and toggled by adding/removing the `.dark` class on `<html>`.

### Rules

1. **Never use Tailwind `dark:` for surface colors.** Use CSS custom properties that auto-switch:
   ```css
   background: var(--surface-card);  /* auto-switches */
   ```
2. **Use `dark:` modifier for Tailwind color utilities** that don't have CSS variable equivalents:
   ```tsx
   className="text-slate-900 dark:text-white"
   ```
3. **Status colors always need both modes:**
   ```tsx
   className="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
   ```

### Testing Checklist

- [ ] All text readable against background
- [ ] Borders visible but not harsh
- [ ] Status colors distinguishable
- [ ] Inputs have contrast against card surfaces
- [ ] Shadows are subtle, not floating

---

## i18n Standards

### Architecture

- **Library**: `react-i18next` + `i18next`
- **Languages**: English (`en`) + Vietnamese (`vi`)
- **Config**: `src/core/i18n.ts` (inline resources)
- **Default**: Vietnamese (`lng: 'vi'`)
- **Fallback**: English (`fallbackLng: 'en'`)

### Key Naming Convention

```
{namespace}.{section}.{element}
```

| Pattern | Example |
|---|---|
| Page title/subtitle | `tenants.title`, `tenants.subtitle` |
| Form labels | `managerUsers.firstName` |
| Buttons | `onboarding.startButton` |
| Toast messages | `permissions.saveSuccess` |
| Confirmation text | `details.confirmSuspend` |
| Status labels | `common.active` |
| Table headers | `tenants.table.name` |
| Nested sections | `systemSettings.maintenance.enable` |

### Namespaces

| Namespace | Pages/Components |
|---|---|
| `common` | Shared across all pages (buttons, status, nav) |
| `login` | LoginScreen |
| `dashboard` | DashboardPage |
| `tenants` | TenantsPage, TenantTable |
| `details` | TenantDetailPage |
| `permissions` | PermissionManager |
| `onboarding` | CustomerOnboardingPage |
| `managerUsers` | ManagerUsersPage |
| `permissionGroups` | PermissionGroupsPage |
| `audit` | AuditLogPage |
| `systemSettings` | SystemSettingsPage |
| `layout` | AdminLayout (sidebar, header, user menu) |
| `customDomain` | CustomDomainTab |
| `disasterRecovery` | DisasterRecoveryTab |
| `webhookMonitor` | WebhookMonitorTab |

### Rules

1. **Every user-facing string MUST use `t('key')`** — no exceptions
2. Use **interpolation** for dynamic values: `t('key', { name: value })`
3. Use `<Trans>` component for strings containing HTML
4. Keep keys flat within sections (max 3 levels deep)
5. Sort keys alphabetically within each section

---

## Quick Reference

### New Page Checklist

```tsx
import { useTranslation } from 'react-i18next';

const MyPage = () => {
  const { t } = useTranslation();

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-page-title">{t('myPage.title')}</h1>
          <p className="text-page-subtitle">{t('myPage.subtitle')}</p>
        </div>
        <button className="btn-primary px-4 py-2.5 flex items-center gap-1.5">
          <Plus size={16} />
          {t('myPage.addItem')}
        </button>
      </div>

      {/* Content */}
      <div className="card p-6">
        <h2 className="text-section-title">{t('...')}</h2>
        {/* ... */}
      </div>
    </div>
  );
};
```

### File Map

```
src/
├── index.css              ← Design tokens & utility classes
├── main.tsx               ← App entry (ThemeProvider, QueryClient)
├── App.tsx                ← Routes & LoginScreen
├── core/
│   ├── ThemeContext.tsx    ← Dark/light toggle
│   └── i18n.ts            ← All translations (en + vi)
├── shared/
│   ├── components/
│   │   ├── Modal.tsx
│   │   └── ConfirmationModal.tsx
│   ├── context/
│   │   └── ToastContext.tsx
│   └── layouts/
│       └── AdminLayout.tsx
├── pages/                 ← Page-level components
└── features/              ← Feature-scoped components
    └── tenants/components/
```
