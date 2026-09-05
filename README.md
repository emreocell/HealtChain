# AI Healthcare Decision Support — HealthChain v2

> Security-first research prototype for **medical-record integrity proofs, patient-controlled blockchain authorization, and AI-assisted clinical education**.

[![CI](https://github.com/emreocell/ai-healthcare-decision-support/actions/workflows/ci.yml/badge.svg)](https://github.com/emreocell/ai-healthcare-decision-support/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/Node.js-%3E%3D22.13-339933?logo=node.js&logoColor=white)
![Hardhat](https://img.shields.io/badge/Hardhat-3.x-FFF100?logo=ethereum&logoColor=111)
![Solidity](https://img.shields.io/badge/Solidity-0.8.34-363636?logo=solidity&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)
![Status](https://img.shields.io/badge/status-research%20prototype-8a5a13)

This repository is a full engineering modernization of my Computer Engineering graduation-project prototype. HealthChain v2 keeps the original research direction while enforcing a stricter rule:

**A public blockchain may prove integrity; it must not become a database for private medical content.**

The system combines a deliberately small Solidity integrity registry, a browser proof client, a consent-gated Node.js API, AI-assisted clinical education, deterministic builds, tests, dependency audit gates, CI, and an explicit threat model.

> [!CAUTION]
> This project is **not** a medical device, diagnostic system, treatment service, electronic health record product, or compliance package. Do not use it for real clinical decisions or store real patient information in the demo.

## Why v2 exists

The thesis implementation proved the original concept, but several patterns were not appropriate for a public, portfolio-grade repository: generated dependencies were committed, deployment details were hardcoded, plaintext medical fields were written on-chain, unrestricted administrative mutation paths existed, and an AI credential appeared in source history.

HealthChain v2 treats those weaknesses as engineering problems to solve rather than hide. See [`docs/MODERNIZATION.md`](docs/MODERNIZATION.md).

## Architecture

```mermaid
flowchart LR
    Patient[Patient / User] --> Web[Browser UI]
    Web -->|salt + canonicalize + SHA-256| Proof[Private local proof bundle]
    Web -->|one salted bytes32 digest| Chain[MedicalRecordRegistry]
    Web -->|explicitly consented context| API[Node.js API]
    API -->|Responses API| AI[Configured OpenAI model]

    Chain --> Audit[Immutable integrity timeline]
    Chain -. never receives .-> PHI[Names / diagnoses / record types / notes / documents]
```

### Data-handling boundaries

| Boundary | What is handled there | What is deliberately excluded |
| --- | --- | --- |
| Public blockchain | One salted record digest, author wallet, timestamp, revocation marker | Names, diagnoses, record categories, notes, documents, identifiers |
| Browser / local proof | Original demo payload, record category, random 32-byte salt, verification bundle | Automatic remote persistence |
| Node.js API | Explicitly submitted, consented educational context | Request-body logging, automatic blockchain writes |
| AI provider | Only the context submitted to the optional AI endpoint | Blockchain private keys, local proof bundle |

Authorization controls **who may write** a patient's integrity proof. It does not make public-chain metadata confidential.

Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md) before extending the system.

## Core capabilities

### Blockchain integrity registry

- Patient-owned provider write authorization.
- Append-only record anchoring.
- One salted `SHA-256` commitment per private local payload.
- No separately guessable diagnosis/category hash on-chain.
- Patient-only revocation markers.
- Duplicate digest prevention per patient.
- Contract events for auditable history.
- No unrestricted medical-record admin and no global patient enumeration helper.

### Local integrity proofs

The browser generates a cryptographically random 32-byte salt and computes a digest from the complete canonical local payload before any blockchain transaction is submitted.

```text
SHA-256( salt_hex + ":" + canonical_json_payload )
```

The record category is part of that payload, so a single salted commitment covers both the category and note without publishing a low-entropy category hash. Only the digest is anchored.

After a successful transaction, the user can download a private JSON proof bundle containing the local payload, salt, digest, chain ID, contract address, and transaction hash. That bundle is excluded by `.gitignore` because it may contain sensitive information. A saved bundle can be verified locally by recomputing its digest.

### Patient-controlled provider authorization

A patient wallet can explicitly authorize or revoke another wallet's ability to append proofs. Providers cannot silently grant themselves permission, and only the patient can mark an existing record as revoked.

The record is never rewritten: revocation is a state marker on an append-only audit history.

### AI-assisted clinical education

The optional Node.js endpoint uses the OpenAI Responses API with a model selected through `OPENAI_MODEL`; the default configuration uses `gpt-5.6-terra`.

The endpoint deliberately requires stronger boundaries than a generic chatbot:

- explicit AI-data-processing consent is required;
- list lengths and string sizes are bounded;
- request bodies are not logged;
- responses are marked `Cache-Control: no-store`;
- request bodies are limited to 16 KB;
- origins are allowlisted;
- a rate limit with stale-bucket cleanup is applied;
- CSP and defensive browser headers are sent;
- instructions prohibit diagnosis, prescription, dosing, and medication changes;
- output is framed as educational notes and questions to discuss with a licensed clinician.

The model can still be wrong. AI output from this project must not be used to make care decisions.

## Technology

| Layer | Technology |
| --- | --- |
| Smart contract | Solidity 0.8.34 toolchain |
| Contract development | Hardhat 3, TypeScript, viem |
| Contract tests | Node.js `node:test` + viem + Hardhat network helpers |
| API | Node.js 22+, Express 5 |
| AI | OpenAI Responses API |
| Browser | Vanilla HTML/CSS/JavaScript + ethers.js |
| CI | GitHub Actions |

## Repository structure

```text
.
├── .github/
│   ├── dependabot.yml
│   └── workflows/ci.yml
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── app.js
│   │   │   ├── clinicalEducation.js
│   │   │   ├── config.js
│   │   │   ├── server.js
│   │   │   └── validation.js
│   │   ├── test/
│   │   │   ├── app.test.js
│   │   │   ├── clinicalEducation.test.js
│   │   │   └── validation.test.js
│   │   └── package.json
│   └── web/
│       ├── assets/
│       │   ├── app.js
│       │   ├── contract-abi.js
│       │   ├── deployment.json
│       │   └── styles.css
│       └── index.html
├── contracts/
│   └── MedicalRecordRegistry.sol
├── docs/
│   ├── ARCHITECTURE.md
│   ├── MODERNIZATION.md
│   └── THREAT_MODEL.md
├── scripts/
│   └── deploy.ts
├── test/
│   └── MedicalRecordRegistry.test.ts
├── .env.example
├── .gitignore
├── .nvmrc
├── CHANGELOG.md
├── CITATION.cff
├── CONTRIBUTING.md
├── SECURITY.md
├── hardhat.config.ts
├── package-lock.json
└── package.json
```

## Quick start

### Requirements

- Node.js `>=22.13.0` (`.nvmrc` currently pins `22.23.0`)
- npm
- MetaMask or another EIP-1193 compatible browser wallet

### 1. Install dependencies

```bash
npm ci
```

### 2. Configure the optional AI feature

```bash
cp .env.example .env
```

Add an API key only if you want to exercise the AI section:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.6-terra
```

Never commit `.env`.

### 3. Start a local chain

```bash
npm run chain
```

The Hardhat development network is expected at `http://127.0.0.1:8545`.

### 4. Deploy the registry

In a second terminal:

```bash
npm run deploy:local
```

The TypeScript deployment script writes the contract address, chain ID, network name, and deployment timestamp to `apps/web/assets/deployment.json`. No contract address is copied into source code manually.

### 5. Start the API and web client

```bash
npm start
```

Open `http://localhost:5000`, connect a wallet configured for the local Hardhat network, and use a local development account.

## Tests, build, and security checks

```bash
npm run check
npm run audit:runtime
npm run audit:critical
npm run test:api
npm run test:contracts
```

Or run both test suites together:

```bash
npm test
```

CI uses the committed lockfile and `npm ci`, compiles the Solidity contract, runs JavaScript checks, rejects high-severity runtime dependency findings, rejects critical findings across the full dependency tree, and executes API plus smart-contract tests.

## Security model

### Plaintext medical data does not belong on a public chain

Public blockchain state is observable and difficult to erase. Version 2 stores one salted integrity digest rather than medical fields or medical field hashes.

### A bare hash of a medical category is not private

Low-entropy values such as common record categories can be dictionary-tested even when hashed. HealthChain therefore does not store a separate category hash. Category + note + other local fields are covered by the same salted full-payload commitment.

### Authorization is not confidentiality

Patient-to-provider authorization restricts writes. It does **not** hide wallet addresses, timestamps, transaction relationships, or other public-chain metadata.

### Medical history is not mutable by a global admin

The original update/delete pattern was replaced with append-only records and patient-controlled revocation markers. Historical integrity events remain auditable.

### Secrets never belong in source control

Runtime credentials are read from environment variables. The repository tracks `.env.example`, never a real `.env`.

> [!IMPORTANT]
> An AI provider credential existed in the historical public repository. Removing it from the current tree does not make the historical value safe. Any credential that ever appeared in public Git history must be considered compromised and revoked/rotated at the provider.

See [`SECURITY.md`](SECURITY.md) for the repository security policy.

## Research origin

This project evolved from my Fırat University Computer Engineering graduation thesis and its implementation prototype.

- Graduation thesis PDF: <https://emreocell.github.io/assets/tez.pdf>
- Portfolio: <https://emreocell.github.io>

HealthChain v2 is a modernization of the implementation and security architecture. It is **not** a claim that the original thesis experiments, datasets, evaluation, or conclusions were reproduced under the new design.

## Current limitations

- No production encrypted health-record database is included.
- No FHIR/HL7 integration is implemented.
- Wallet addresses are pseudonymous, not anonymous.
- Blockchain metadata remains public.
- The smart contract has not undergone a professional third-party audit or formal verification.
- The in-memory API rate limiter is intended for a single research instance, not horizontal production scaling.
- AI output is not clinically validated.
- The repository does not claim HIPAA, GDPR, KVKK, medical-device, hospital-system, or other healthcare regulatory compliance.

## Roadmap

- Encrypted off-chain storage adapter with envelope encryption.
- FHIR-compatible resource mapping without placing FHIR payloads on-chain.
- Signed provider attestations and an institution identity layer.
- Smart-contract fuzzing and property/invariant tests.
- Privacy-preserving proof experiments for selective disclosure.
- End-to-end browser tests against a local Hardhat node.
- Reproducible research fixtures using synthetic, non-patient data only.

## Contributing and citation

Security and privacy boundaries are part of the architecture, not optional conventions. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before submitting changes.

Academic/software citation metadata is available in [`CITATION.cff`](CITATION.cff).

## License

MIT License — see [`LICENSE`](LICENSE).

---

Built by **Emre Öcel** as an engineering-focused evolution of the original graduation-project prototype.
