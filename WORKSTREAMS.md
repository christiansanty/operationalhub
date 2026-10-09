# Operational Hub — Shared Project

The product name is **Operational Hub**. Seven Students is a separate learning application that Operational Hub may launch as an internal module.

## Active chats

### Seven Students — Academy & Training Data

- Source project: `/Users/christiandominguez/Documents/Codex/projects/seven-students`
- Owns the Seven Students learning application.
- Owns `TRAININGS - Learning Center` extraction and catalog generation.
- Owns courses, lessons, assessments, training resources and certificates.
- Primary generated data: `seven-students/src/data/airtableTraining.js`.

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

Operational Hub is an independent Codex project. Seven Students is the canonical project for Academy training code; no Academy code should be added to Seven Insurance or mixed into the Operational Hub shell.
