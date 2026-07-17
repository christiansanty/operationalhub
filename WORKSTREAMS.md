# Operational Hub — Shared Project

Both Codex chats work in this same application and filesystem. The product name is **Operational Hub**. Eastern Medical Academy is one module inside the Hub.

## Active chats

### Operational Hub — Academy & Training Data

- Owns the Eastern Medical Academy module.
- Owns `TRAININGS - Learning Center` extraction and catalog generation.
- Owns courses, lessons, assessments, training resources and certificates.
- Primary generated data: `src/data/airtableTraining.js`.

### Operational Hub — Personal, Licenses & Staff

- Owns the Operational Hub shell and executive dashboard.
- Owns Personnel, Staff, Licenses, ACA monitoring, global search, AI Assistant and Roadmap.
- Owns EM-MSO and Human Resource mappings.

## Coordination rules

1. Preserve changes made by the other workstream.
2. Prefer module-specific data and components over rewriting shared sections.
3. Read `git status` and this file before editing shared files.
4. Keep secrets and raw Airtable exports in ignored local files only.
5. Verify the complete application after integrating changes.

## Shared application

- Current filesystem path: `/Users/christiandominguez/Documents/Codex/projects/operational-hub`
- Product name: `Operational Hub`
- Package name: `operational-hub`

Operational Hub is now an independent Codex project. The original `eastern-medical-academy` checkout is retained only as a migration fallback until the replacement chats are verified.
