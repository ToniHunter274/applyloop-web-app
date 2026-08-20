# Applicant Accuracy V3

This revision preserves the separate seven-role architecture and updates only the Applicant workspace to match the supplied Applicant design references and Corrections V2.

## Applicant navigation

- Dashboard
- My Clients
- Workshop
- Feedback and Messages
- Performance
- Settings

## Implemented corrections

- Applicant remains separate from User/Client.
- Notification bell is blue.
- Dashboard uses the supplied four-card layout.
- The fourth dashboard card is Client Feedback.
- The client application table is a record database, not an activity monitor.
- Table columns are Client, Company, Position, Location, Date, Status, and Link Source.
- Status choices are Interview Scheduled, Waiting, Offer Received, Rejected, and Submitted.
- Link Source choices are Client, Finder, and Applicant.
- Application Output Graph and Priority Applications are not included.
- My Clients uses Client Feedback in place of the former interview summary box.
- Applicant demo identity matches the supplied screens.
- Duplicate readiness and settings elements were removed.
- The desktop sidebar remains visible on compact laptop widths to preserve the supplied design proportions.

## Applicant routes

- `/applicant`
- `/applicant/clients`
- `/applicant/clients/[clientId]`
- `/applicant/clients/[clientId]/applications/[applicationId]`
- `/applicant/workshop`
- `/applicant/feedback`
- `/applicant/performance`
- `/applicant/settings`

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000/auth/login` and select the Applicant role demo.
