# 002 Todos vs Tasks

## Status
Accepted

## Context
The team needs a lightweight place to capture raw ideas quickly, but also a structured place to manage real work.

## Decision
- **Todos** are lightweight notes and rough ideas
- **Tasks** are structured execution items
- A Todo can be converted into a Task when it becomes implementation work
- Converted todos remain separate entities and are marked as converted, rather than being merged into tasks directly

## Consequences
### Positive
- Fast idea capture without forcing structure too early
- Clear transition from note → work item
- Less friction in planning

### Tradeoffs
- Some information may need to be copied or refined during conversion
- We must keep the conversion UX clear
