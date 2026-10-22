# IT application scope synchronization

Operational Hub exposes the public application scope in `GET /api/it/scope` for authenticated users with IT access. The catalog is organized by application, then by module, tools and AI-agent function.

## Push on every application deployment

Each application repository should publish a JSON manifest at:

```text
/.well-known/operational-scope.json
```

The same manifest can be pushed directly after a successful deployment:

```json
{
  "applicationId": "binium",
  "version": "1.2.3",
  "commitSha": "abc123",
  "repository": "https://github.com/example/binium",
  "purpose": { "en": "What the application does.", "es": "Qué hace la aplicación." },
  "modules": [
    {
      "id": "workflow",
      "name": { "en": "Workflow", "es": "Flujo" },
      "summary": { "en": "What this module does.", "es": "Qué hace este módulo." },
      "tools": ["Queue", "Task stages"],
      "aiRole": { "en": "What the AI agent does and its boundary.", "es": "Qué hace el agente de IA y cuál es su límite." }
    }
  ],
  "aiAgents": [
    {
      "name": { "en": "Application assistant", "es": "Asistente de la aplicación" },
      "function": { "en": "Human-reviewed assistance.", "es": "Asistencia revisada por una persona." }
    }
  ]
}
```

Send it to Operational Hub with `IT_SCOPE_SYNC_KEY`:

```bash
curl -X POST "$OPERATIONAL_HUB_URL/api/integrations/application-push" \
  -H "content-type: application/json" \
  -H "x-it-scope-sync-key: $IT_SCOPE_SYNC_KEY" \
  --data-binary @.well-known/operational-scope.json
```

Operational Hub records the version, commit, repository, source and synchronization timestamp. When `UNIVERSAL_BASE_URL` and `UNIVERSAL_SYNC_TOKEN` are configured, the same push is relayed to Universal Master RPA. The IT scope page also polls configured application URLs for the manifest, so connected applications can refresh without an administrator editing the catalog.

Do not include PHI, credentials, tokens, passwords or other confidential records in a scope manifest.
