# ApplyLoop API Contract Draft

This document describes the frontend data requirements. Exact field names can change, but the backend and frontend teams should agree on one version before replacing mock data.

## Authentication

### `POST /api/auth/login`

Request:

```json
{
  "email": "user@applyloop.com",
  "password": "secret"
}
```

Response:

```json
{
  "token": "access-token",
  "refreshToken": "refresh-token",
  "user": {
    "id": "USR-1001",
    "name": "Amina Bello",
    "email": "user@applyloop.com",
    "role": "user_client"
  }
}
```

Allowed role values:

- `user_client`
- `applicant`
- `chief_applicant`
- `prompt_engineer`
- `team_auditor`
- `chief_auditor`
- `owner`

The backend must enforce permissions. Hiding a link in the frontend is not authorization.

`user_client` and `applicant` are separate role values and must not be interchanged.

## List response shape

All paginated endpoints should return:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "total": 0,
    "totalPages": 0
  }
}
```

Use query parameters for `page`, `pageSize`, `search`, `status`, `team`, `sort`, `from`, and `to` where applicable.

## Applications

- `GET /api/applications`
- `POST /api/applications`
- `GET /api/applications/:id`
- `PATCH /api/applications/:id`
- `POST /api/applications/:id/assign`
- `POST /api/applications/:id/submit`
- `POST /api/applications/:id/feedback`

Minimum application fields:

```json
{
  "id": "APP-4832",
  "applicant": { "id": "USR-1", "name": "Amina Bello" },
  "company": "Stripe",
  "position": "Product Manager",
  "country": "United States",
  "applicantOwner": { "id": "USR-2", "name": "Chinedu Eze" },
  "promptEngineer": { "id": "USR-3", "name": "Tobi Akin" },
  "auditor": { "id": "USR-4", "name": "Sarah Cole" },
  "status": "in_audit",
  "priority": "high",
  "qualityScore": 96,
  "createdAt": "2026-07-27T10:00:00Z",
  "updatedAt": "2026-07-27T10:12:00Z"
}
```

## Prompt tasks

- `GET /api/prompt-tasks`
- `GET /api/prompt-tasks/:id`
- `PATCH /api/prompt-tasks/:id`
- `POST /api/prompt-tasks/:id/submit`
- `POST /api/prompt-tasks/:id/revision`

Prompt text, job descriptions, resumes, and cover letters may contain sensitive information. Do not write them to application logs or analytics events.

## Audits

- `GET /api/audits`
- `GET /api/audits/:id`
- `POST /api/audits/:id/approve`
- `POST /api/audits/:id/request-revision`
- `POST /api/audits/:id/escalate`
- `GET /api/escalations`
- `POST /api/escalations/:id/resolve`

Every decision should create an immutable audit-log record containing actor, timestamp, previous status, new status, reason, and affected document version.

## Users and teams

- `GET /api/users`
- `POST /api/users/invite`
- `PATCH /api/users/:id`
- `POST /api/users/:id/suspend`
- `GET /api/teams`
- `PATCH /api/teams/:id`

## Billing

- `GET /api/subscriptions`
- `GET /api/subscriptions/:id`
- `POST /api/subscriptions/:id/pause`
- `POST /api/subscriptions/:id/resume`
- `POST /api/subscriptions/:id/cancel`
- `GET /api/revenue/summary`

Never send full card numbers, security codes, or payment-provider secrets to this frontend.

## Reports and dashboard summaries

- `GET /api/dashboard/:role`
- `GET /api/reports`
- `POST /api/reports`
- `GET /api/reports/:id/download`

Long-running reports should be asynchronous. Return a report ID and status, then notify the frontend when the download is ready.
