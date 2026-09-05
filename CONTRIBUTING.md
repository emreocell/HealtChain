# Contributing

Contributions are welcome when they preserve the project's security and research boundaries.

## Before opening a pull request

1. Do not use real patient data in examples, tests, screenshots, fixtures, or issues.
2. Do not add secrets or private keys to the repository.
3. Keep personally identifiable or clinical content off-chain.
4. Add or update tests for smart-contract authorization changes.
5. Keep AI behavior educational and non-diagnostic.
6. Run:

```bash
npm run check
npm run test
```

## Design principle

Prefer small, auditable changes over adding infrastructure for appearance. This project intentionally separates integrity proofs, local/private clinical data, and optional AI processing.
