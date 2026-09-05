# Changelog

All notable changes to this project are documented here.

## [2.0.0] - 2026-09-05

### Added

- Security-first `MedicalRecordRegistry` smart contract.
- Patient-controlled provider write authorization and revocation markers.
- Browser-side salted SHA-256 integrity proof generation and local proof verification.
- Explicit-consent AI-assisted clinical education endpoint.
- Structured API validation, request-size bounds, rate limiting, CORS allowlisting, and no-store responses.
- Hardhat 3 + viem + `node:test` contract toolchain.
- API and smart-contract tests, dependency audit gates, and GitHub Actions CI.
- Architecture, threat-model, security, contribution, and modernization documentation.
- Dependabot, deterministic npm lockfile, Node version pinning, and research citation metadata.

### Changed

- Reorganized the original thesis implementation into `apps/`, `contracts/`, `scripts/`, `test/`, and `docs/` boundaries.
- Moved clinical content off-chain; the public blockchain now stores integrity/audit metadata only.
- Replaced unrestricted administrative record mutation with append-only proofs and patient-controlled authorization.
- Replaced hardcoded deployment configuration with generated deployment metadata.
- Replaced hardcoded AI credentials with environment-based configuration.

### Removed

- Tracked `node_modules`, Hardhat generated artifacts/cache, local environment files, and starter boilerplate.
- Plaintext patient names and medical-condition strings from smart-contract storage.
- Unrestricted admin update/delete paths from the medical-record model.

## [1.x] - Thesis prototype

The original repository represented the graduation-thesis proof of concept. Version 2 is a security and engineering modernization; it does not claim that the original academic experiments or conclusions were re-run.
