---
name: write-unit-test
description: Write Vitest unit test for a given file following project conventions.
---

# Write Tests for a Given File

## Before You Start

1. **Get the file path** from the user
2. Read the file to understand its exports and functionality
3. Create or update the corresponding test file in the same directory

## Framework & Imports

Always use **Vitest** only. Import from `"vitest"`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
```

## File Location & Naming

- Co-locate test files next to the source: `index.test.ts`
- For standalone utility functions: `<functionName>.test.ts`

## What to Test

Focus on the **exported functions/classes** in the given file:
- Write tests that cover all success paths
- Write tests for each distinct error condition
- Test edge cases and optional parameters if they alter execution flow

## Test Principles (from code-rules)

- **Black box only**: test inputs and outputs (return values, thrown errors). Never assert that mocked functions were called or what arguments they received.
- **One test case per distinct flow**: do not duplicate test cases that differ only in which field is checked. Separate cases only when the execution path differs (e.g. missing optional param, each distinct error condition).
- Use nested `describe` only when grouping substantially different sub-behaviors.
