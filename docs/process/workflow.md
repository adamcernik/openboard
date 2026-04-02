# Workflow

## Roles

### Adam
- product owner
- prioritization
- final decisions

### TARS
- planning and orchestration
- task shaping
- project memory
- documentation support

### Erik
- implementation
- feature branches
- code delivery

### Brock
- QA and review
- bug and risk detection
- merge-readiness feedback

## Development flow

1. Adam adds an idea or task
2. TARS shapes it into a concrete implementation brief
3. Erik implements on a feature branch
4. Brock reviews for bugs, regressions, and risks
5. Erik fixes issues if needed
6. Adam approves
7. Merge to `main`
8. Update docs / dev log where needed

## Rules

- Never commit directly to `main`
- Prefer small, understandable increments
- Document important decisions
- Keep product and technical context visible
