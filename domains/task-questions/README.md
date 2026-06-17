# @vassembly/domain-task-questions

Stores human-in-the-loop questions and answers for tasks (1-to-1 with task via `taskId`).

## Commands

- `recordQuestions` — append pending questions and register a blocked invocation
- `submitAnswer` — move a pending question to answered history
- `clearBlockedInvocations` — clear blocked invocations after resume
- `deleteByTaskId` — cascade delete when task is removed

## Queries

- `getTaskQuestions` — fetch questions document by `taskId`
