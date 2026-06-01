# Contributing

## Branches

- `main` - production-ready releases.
- `develop` - integration branch.
- `staging` - release candidate branch.

Use conventional commits:

```text
feat(web): add lead capture
fix(api): validate payment amount
docs: update deployment guide
```

Before opening a PR:

```bash
npm run typecheck
npm run build
```
