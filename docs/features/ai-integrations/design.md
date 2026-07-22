# AI Integrations Management UI — Design Specification

## Design Rationale

Phase 8 introduces a dedicated settings sub-route for managing AI provider credentials, separate from the single-page settings scroll pattern. This separation reflects the CRUD-heavy nature of integrations (list filters, connection testing, destructive dialogs) versus lightweight preference toggles on the main settings page.

Visual language follows **The Synthetic Luminal**: tonal stacking on `surface-container-high` form cards, no divider lines between table rows, and restrained use of primary (blue) for provider tags and success/error tags for connection state. Agent usage counts use Space Grotesk-adjacent body typography for a technical readout feel.

The agent form picker reuses the same provider labeling and routes users to this management surface when no connected integration exists.

---

## Specifications

### List page (`/settings/ai-integrations`)

| Element | Spec |
|---------|------|
| Layout | `sectionCard` shell, back link to `/settings`, h1 + body intro |
| Toolbar | Primary CTA right-aligned on desktop; filters group: search, status, provider |
| Table columns | Name, Provider, Status, Connection, Agents using, Created, Actions |
| Pagination | 10 rows per page, matches agents list |
| Loading | Full-width `Loader` below toolbar |
| Error | `Alert variant="error"` above toolbar |

**Filters**

- Status: All / Active / Disabled / Archived
- Provider: All / Gemini / ChatGPT / LM Studio
- Search: debounced 300ms, resets page to 0

**Status badges**

| Status | Tag variant | Notes |
|--------|-------------|-------|
| active | success | — |
| disabled | default | — |
| archived | warning | strikethrough label |

**Connection badges**

| Status | Tag variant |
|--------|-------------|
| connected | success |
| failed | error |
| untested | warning |

**Row actions**

- Edit → `/settings/ai-integrations/[id]/edit`
- Test → inline test via saved `credentialId`, snackbar result, refresh list
- Delete (non-archived) → modal with agent usage warning
- Restore (archived) → confirm modal

### Create / Edit form

| Field | Create | Edit |
|-------|--------|------|
| Name | editable | editable |
| Provider | dropdown | read-only |
| API key | password, required* | password, optional (keep existing) |
| Base URL | LM Studio only | LM Studio only |
| Organization ID | ChatGPT optional | ChatGPT optional |

\*Required per provider rules (Gemini/ChatGPT: key; LM Studio: base URL).

**Flow**

1. Fill provider-specific fields
2. **Test connection** (required before save)
3. On success → enable Create/Update
4. Submit → REST create/patch → snackbar → redirect to list

Form sits in `surface-container-high` card with `formStack` spacing. Test result uses inline success/error text plus `Alert` for details.

### Dialogs

**Delete**

- Title: "Delete integration"
- Body: name confirmation
- If `agentUsageCount > 0`: warning copy about stale agent references
- Cancel (outlined) + Delete (danger contained)

**Restore**

- Title: "Restore integration"
- Short explanatory copy
- Cancel + Restore (contained)

### Agent form picker

- Dropdown: active + connected integrations only (current selection retained on edit if disconnected)
- Label: "AI integration"
- Secondary action: "Manage integrations" → `/settings/ai-integrations`
- Required field with validation message

---

## Component Variations

### ConnectionStatusBadge

- States: `connected`, `failed`, `untested`, unknown fallback

### AiIntegrationStatusBadge

- States: `active`, `disabled`, `archived` (strikethrough)

### TestConnectionButton

- Default, loading (`isTesting`), success label, error label

### AiIntegrationForm

- Create vs edit title
- Provider-conditional fields visible/hidden
- Submit disabled when: submitting, testing, or no successful test in session

---

## Accessibility Notes

- Table actions use text buttons with explicit labels (Edit, Test, Delete, Restore)
- Loader includes `ariaLabel`
- Filter dropdowns have stable `id` attributes
- Modal focus trap via `@vassembly/ui-system-design/modal`
- Password field uses `type="password"` — keys never displayed after entry
- API key hints on edit show masked suffix only (`apiKeyHint`)

---

## Developer Handoff

### Routes

```
/settings/ai-integrations              → list
/settings/ai-integrations/create       → create
/settings/ai-integrations/[id]/edit    → edit
```

### Data sources

- List: GraphQL `aiIntegrations` via `useAiIntegrations`
- CRUD + test: REST `/ai-integrations/*` via api-hooks mutations
- Agent picker: `useAiIntegrations({ status: 'active' })`, client filter `connectionStatus === 'connected'`

### SCSS modules

| File | Scope |
|------|-------|
| `AiIntegrationsList.module.scss` | List shell, toolbar, table, badges |
| `AiIntegrationForm.module.scss` | Form card, test row, actions |
| `dialogs.module.scss` | Modal stack shared by delete/restore |
| `IntegrationCredentialPicker.module.scss` | Agent form picker stack |

### Responsive behavior

- **Desktop**: toolbar row with filters right-aligned; table full width
- **Tablet/mobile**: filters stack vertically; action buttons remain in column at row end; form card padding reduces to `$spacing-4`

### Security

- Never render plaintext API keys
- Edit form: empty API key means "keep existing"
- Test on edit without new key uses `credentialId` body (server-side decode)

### Settings entry point

- Section `#ai-integrations` on main settings page with CTA to full management route
- Desktop nav anchor added in `sectionAnchors.ts`
