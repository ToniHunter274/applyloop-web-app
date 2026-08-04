# Seven-Role Correction

The platform now treats User/Client and Applicant as separate roles.

## Roles

1. User/Client
2. Applicant
3. Chief Applicant
4. Prompt Engineer
5. Team Auditor
6. Chief Auditor
7. Owner

## User/Client

The former User/Client visual design has been restored. Its existing routes remain:

- `/dashboard`
- `/applications/[id]`
- `/loop-lab`
- `/growth`
- `/billing`
- `/settings`
- `/notifications`

Changing a dashboard summary section resets pagination to page 1.

## Applicant

The new Applicant workspace is separate and begins at `/applicant`.

- `/applicant`
- `/applicant/clients`
- `/applicant/applications`
- `/applicant/queue`
- `/applicant/performance`
- `/applicant/activity`

Applicant mock data is stored in `src/data/applicantData.js` and the screens are implemented in `src/features/applicant/ApplicantPortal.js`.
