# Security Policy

## Scope

This repository is a research prototype. It is **not** a production electronic health record system, medical device, diagnostic service, or HIPAA/GDPR compliance package.

## Sensitive data rules

- Never commit API keys, wallet private keys, `.env` files, patient identifiers, clinical documents, or real medical records.
- Never place plaintext health information, diagnoses, or record categories on a public blockchain.
- The smart contract stores one salted record digest plus public audit metadata; it does not publish separate hashes for low-entropy medical fields.
- Local proof bundles can contain health information. Treat them as sensitive files and do not commit them.
- The API intentionally avoids logging request bodies because they may contain health context.

## Historical credential exposure

An earlier prototype version committed an AI provider credential directly in source code. Any credential that has ever appeared in repository history must be considered compromised and revoked at the provider. Removing it from the current tree does not make that credential safe again.

## Reporting a vulnerability

Please avoid publishing secrets, private health information, or weaponized exploit steps in a public issue. Report the minimum reproducible technical detail needed to explain the problem and rotate any exposed credential immediately.
