# @vassembly/ui-system-design

Vassembly design system components in a single package with **per-component subpath exports**.

## Usage

Add the workspace dependency:

```json
"@vassembly/ui-system-design": "workspace:*"
```

Import only what you need (each subpath resolves to one component module):

```typescript
import { Button } from '@vassembly/ui-system-design/button';
import { Text } from '@vassembly/ui-system-design/text';
import { resolveClassName } from '@vassembly/ui-system-design/utils';
```

Design tokens in SCSS:

```scss
@import '@vassembly/ui-system-design/src/theme/tokens/index.scss';
```

## Scripts

- `pnpm lint`
- `pnpm check-types`
- `pnpm test`
