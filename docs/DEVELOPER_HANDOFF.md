# ApplyLoop Frontend Handoff

## What was implemented

The original repository contained a partially completed client portal and legacy restaurant-management pages. This delivery keeps the former User/Client design, adds a separate Applicant workspace, and retains the reusable operations portal for:

- User/Client
- Applicant
- Chief Applicant
- Prompt Engineer
- Team Auditor
- Chief Auditor
- Owner

All staff portals use the same shared shell, tables, cards, charts, filters, status badges, modals, pagination, and responsive navigation. This prevents six copies of the same UI from drifting apart.

## Demo access

Run the app and open `/auth/login`. The login page contains one-click demo buttons for every role. The selected role is stored in `applyloopUserData` and the user is routed to the correct dashboard.

Demo password fields are not connected to a production identity provider. They exist only to make the frontend reviewable before the backend is connected.

## Important routes

### User/Client

- `/dashboard`
- `/applications/[id]`
- `/loop-lab`
- `/growth`
- `/billing`
- `/settings`
- `/notifications`

### Applicant

- `/applicant`
- `/applicant/clients`
- `/applicant/applications`
- `/applicant/queue`
- `/applicant/performance`
- `/applicant/activity`

### Chief Applicant

- `/chief-applicant`
- `/chief-applicant/applicants`
- `/chief-applicant/applications`
- `/chief-applicant/reviews`
- `/chief-applicant/performance`
- `/chief-applicant/activity`
- `/chief-applicant/reports`

### Prompt Engineer

- `/prompt-engineer`
- `/prompt-engineer/tasks`
- `/prompt-engineer/history`
- `/prompt-engineer/insights`
- `/prompt-engineer/messages`

### Team Auditor

- `/team-auditor`
- `/team-auditor/queue`
- `/team-auditor/reviews`
- `/team-auditor/escalations`
- `/team-auditor/quality`
- `/team-auditor/activity`

### Chief Auditor

- `/chief-auditor`
- `/chief-auditor/audits`
- `/chief-auditor/auditors`
- `/chief-auditor/escalations`
- `/chief-auditor/quality`
- `/chief-auditor/reports`

### Owner

- `/owner`
- `/owner/users`
- `/owner/applications`
- `/owner/operations`
- `/owner/subscriptions`
- `/owner/revenue`
- `/owner/quality`
- `/owner/reports`
- `/owner/settings`

## Main files

- `src/shared/config/roles.js`: role identifiers, route mapping, navigation, page titles, and demo users.
- `src/shared/context/AuthContext.js`: session restoration, role selection, role switching, profile updates, and logout.
- `src/shared/components/RoleLayout.js`: shared staff portal shell.
- `src/shared/components/PortalUI.js`: reusable cards, tables, badges, filters, charts, buttons, fields, and modals.
- `src/features/portal/RolePortal.js`: role-aware page rendering and screen interactions.
- `src/data/portalData.js`: frontend mock data to replace with API responses.
- `src/shared/components/DashboardLayout.js`: restored User/Client shell using authenticated user data.
- `src/features/applicant/ApplicantPortal.js`: dedicated Applicant workspace.
- `src/data/applicantData.js`: Applicant workspace mock data.

## Backend integration rule

Do not add raw `fetch` or Axios calls inside page components. Add endpoint methods to `src/shared/services/applyLoopApi.js`, then load data through feature hooks or page effects. The current mock arrays should remain available as development fallbacks until each endpoint is stable.

## Definition of done for backend connection

A feature is complete only when it supports:

1. Loading state.
2. Empty state.
3. API error state with retry.
4. Populated state.
5. Permission failure.
6. Successful mutation feedback.
7. Mobile and desktop layouts.
8. No console errors.

## Legacy files

The repository still contains old restaurant pages such as `orders.js`, `menu.js`, and `inventory.js`. They are not linked from the ApplyLoop navigation. They were deliberately left in place to avoid deleting unknown dependencies without confirmation. Remove them in a separate cleanup pull request after checking imports and deployment history.

## Recommended pull request structure

Keep each PR limited to one domain:

- Authentication and permissions.
- User/Client API connection.
- Chief Applicant operations.
- Prompt production.
- Audit workflow.
- Owner billing and reporting.
- Legacy cleanup.

Each PR should include changed routes, endpoint assumptions, desktop and mobile screenshots, testing steps, and unresolved questions.
