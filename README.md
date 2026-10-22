# Operational Hub

Interactive bilingual operations prototype for EM Group. Eastern Medical Academy now lives inside the broader hub as one of its modules.

## Academy backend

The Academy backend stores the complete Airtable schema and records in `private/academy.sqlite`, keeps downloaded attachments under `private/attachments`, and exposes a sanitized catalog API to the frontend. Secrets and backend data remain ignored by Git.

- `pnpm academy:sync` — export Airtable, reuse/download attachments, build the catalog, and ingest SQLite.
- `pnpm backend` — run the API and production frontend on `http://127.0.0.1:4176`.
- `pnpm dev:full` — run the backend plus Vite development server with `/api` proxying.
- `GET /api/academy/status` — backend ingestion status.
- `GET /api/academy/catalog` — sanitized Academy catalog used by the frontend.
- `POST /api/academy/sync` — protected manual sync using the `x-sync-key` header.
- `GET /api/academy/welcome-video` — institutional welcome-video status.
- `PUT /api/academy/welcome-video` — administrator-only MP4/WebM/OGG/MOV/M4V upload, stored privately with a 350 MB limit.

Copy `.env.example` to `.env.local` and provide the Airtable token and an `ACADEMY_SYNC_KEY`. Never expose either value through a `VITE_*` variable.

## Operational EM-MSO backend

`EM-MSO` is the source of truth for the provider roster, insurance contracts, licensing and entity records. Configure `AIRTABLE_EMMSO_BASE_ID=appCtkLVbC33nRuh1`, grant the personal access token `data.records:read` and `schema.bases:read` access to that base, then run `pnpm airtable:operational:sync`.

The synchronization stores a sanitized copy in `private/operational-hub.sqlite` and downloads approved provider, contract and licensing attachments into `private/operational-airtable-attachments`. `DOB`, `SSN`, `PERSONAL DOC`, banking fields and secrets are excluded from the application payload.

- `GET /api/operational/airtable/status` — source and synchronization status.
- `GET /api/operational/airtable/snapshot` — sanitized providers, contracts, licenses and entity records.
- `POST /api/operational/airtable/sync` — protected manual sync using `OPERATIONAL_AIRTABLE_SYNC_KEY` in `x-sync-key`.
- `GET /api/operational/airtable/attachments/:id` — protected-backend copy of an approved Airtable attachment.

## ACA / AHCA authorized RPA

The Licenses module includes a dedicated ACA / AHCA compliance center for facility licenses, Level 2 background screening and the employee/contractor roster. AHCA portal checks are performed by an authorized-firm RPA worker; Operational Hub does not log in to AHCA from the browser.

Configure `ACA_RPA_PROVIDER`, `ACA_RPA_CALLBACK_KEY` and `ACA_RPA_ENABLED` only on the server. The private worker contract is:

- `POST /api/integrations/aca/checks` — queue a verification from Operational Hub.
- `GET /api/integrations/aca/rpa/jobs/next` — authorized worker claims the next job using `x-rpa-key`.
- `POST /api/integrations/aca/rpa/jobs/:id/result` — worker returns `completed`/`failed` plus normalized records using `x-rpa-key`.
- `GET /api/integrations/aca/status` — connection, queue and synchronization status.

Normalized result records require `externalId` and `subject`; they may also include `facility`, `status`, `expiresOn`, `lastVerifiedAt` and source-specific fields. Portal credentials must remain in the authorized firm's credential vault and must never be posted to Operational Hub.

## Eastern Medical Research restricted module

Eastern Medical Research uses a private SQLite-backed store for leads, study/protocol activation, study assignments, screening/consent controls, safety-event records, audit events and an outbox. Research records are scoped to the `research` entity; lead contacts require the separate `research-leads:contact:view` permission, and participant references are internal identifiers only. Research leads, studies and participant data are not included in Operational AI, Universal, web search or the global lead center.

The available EM Connect envelope documents `contact.upserted`, `conversation.upserted` and `message.upserted` with HMAC-SHA256 signing, but it does not define an explicit Research routing field. Therefore the module accepts no live Research delivery until `sourceType` routing and signed delivery are agreed and verified. Outbound updates remain in `pending_external_contract` outbox state. Configure `RESEARCH_EM_CONNECT_WEBHOOK_SECRET` only after that contract is approved.

Universal is represented as a configuration-required / pending-verification status only. No Universal request or Research data transfer is made. The related server-only values are `RESEARCH_UNIVERSAL_BASE_URL`, `RESEARCH_UNIVERSAL_TOKEN` and `RESEARCH_UNIVERSAL_CONTRACT_VERSION`.

## IT workspace

The IT section uses a private SQLite-backed roadmap and proposal store. It seeds the existing Operational Hub application registry plus Universal catalog records, and keeps Art RPA and Medical RPA as separate roadmap lines. Blank connector, repository and access-link settings remain visibly unconnected or without evidence; the system never promotes a URL or source-code record to a verified integration state by itself.

- `GET /api/it/catalog` — authenticated application catalog with configured links only.
- `GET /api/it/roadmap` — authenticated read-only roadmap with filters, evidence state and attention flags.
- `POST/PATCH /api/it/roadmap` — requires the explicit `it:manage` permission and writes an audit event/history record.
- `GET /api/it/proposals` — returns the current user’s proposals, or the full inbox for `it:manage`.
- `POST /api/it/proposals` — any active user may submit a server-stored proposal; proposal text rejects patient, PHI, credential and secret terms.
- `PATCH /api/it/proposals/:id` — requires `it:manage`; status changes and decline explanations are audited.

The IT permission keys are `it:view` and `it:manage`. Entity, contracting, application-launcher and other unrelated permissions do not grant IT management. No email, external notification, repository write, secret change or deployment is performed by this workspace. Optional `UNIVERSAL_BASE_URL`, `ART_RPA_URL`, `MEDICAL_RPA_URL` and `IT_REPOSITORY_*` values document future connectors; when blank, the UI reports no connection or no data.

## Run locally

```bash
pnpm install
pnpm dev:full
```

Open `http://127.0.0.1:4173`. Select **Entrar al hub demo** to administer the local preview.

## Users, invitations and access

Administration → Users stores accounts, invitations, password hashes and sessions in the private server database. Administrators can use the Academy, Custom, Administrator and Executive profiles; Custom access supports None, View or Manage independently for every Hub section and connected application.

To deliver invitation emails, configure these server-only values in `.env.local`:

```bash
APP_PUBLIC_URL=https://your-operational-hub.example.com
RESEND_API_KEY=re_your_server_side_key
INVITATION_FROM_EMAIL="Operational Hub <onboarding@your-verified-domain.com>"
HR_FROM_EMAIL="EM Group Human Resources <hr@your-verified-domain.com>"
```

Without those values, local invitations return a one-time development link in the Users screen. Invited users use the link to create a password, activate the account and start a seven-day server session.

Human Resources → Employee Package supports future hires before an employee account exists. HR selects master documents and sends either a secure return portal or a tracked DocuSign draft. Completed files enter the protected onboarding inbox and remain unassigned until HR selects the matching employee record. `HR_FROM_EMAIL` uses the same Resend account; when it is not configured, the app opens a manual email draft containing the personal secure link. DocuSign automatic return requires `DOCUSIGN_CONNECT_URL` and `DOCUSIGN_CONNECT_HMAC_SECRET` in addition to the account credentials.

## Included in this prototype

- English/Spanish interface
- Operational overview across six entities
- Global search with direct module navigation
- Interactive Operational AI assistant prototype
- Delivery roadmap with completed, in-progress, and planned integrations
- License tracking, renewal status, owners and alerts
- Staff/provider directory modeled from the shared EM-MSO Airtable
- Employee sign-in experience
- Eastern Medical Academy module
- Learning dashboard and course catalog
- Common training and specialization paths
- Interactive lesson and knowledge check
- Local training progress demonstration
- Printable internal certificate and downloadable JSON training record
- Team progress dashboard with CSV export

## Production notes

Production deployment still requires security review, HTTPS, a verified email domain, rate limiting, password recovery, administrative audit review, backup policy and secret management. Airtable synchronization, notifications, LMS/HRIS integration, clinical content, HIPAA training, insurance compliance, procedure claims, and certification criteria require formal technical, legal, medical, and compliance review. Prototype expiration dates and alert totals must be reconciled against the source records before operational use.
