# ApplyLoop Web App

A responsive Next.js frontend for ApplyLoop’s client-facing portal and internal operations workflows.

## Included workspaces

- User/Client
- Applicant
- Chief Applicant
- Prompt Engineer
- Team Auditor
- Chief Auditor
- Owner

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The app redirects to the login page. Select any of the seven role demos to review its workspace.

## Technology

- Next.js 14 Pages Router
- React 18
- Tailwind CSS
- React Icons
- Chart.js dependencies retained for existing User/Client pages
- Mock operational data while backend endpoints are being finalized

## Architecture

Role definitions are centralized in `src/shared/config/roles.js`.

- User/Client screens use the original client routes and `DashboardLayout.js`.
- Applicant screens use `src/features/applicant/ApplicantPortal.js` and `/applicant/*` routes.
- Chief Applicant, Prompt Engineer, Team Auditor, Chief Auditor, and Owner use the shared staff portal foundation.

Read `docs/DEVELOPER_HANDOFF.md` before continuing development and `docs/API_CONTRACT.md` before connecting backend endpoints.