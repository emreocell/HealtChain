# Threat Model

| Risk | Why it matters | Mitigation in this prototype | Remaining limitation |
| --- | --- | --- | --- |
| Plaintext health data on-chain | Public and effectively permanent disclosure | Only one salted `bytes32` integrity digest plus audit metadata is stored | Wallet, author, time, hash, and transaction patterns remain public |
| Dictionary attack against medical fields | Names, diagnoses, and record categories can have low entropy | No separate field hashes; a random 32-byte salt protects the complete local payload commitment | The private proof bundle must remain confidential |
| Unauthorized record mutation | A malicious wallet could alter patient history | Append-only records, patient-controlled provider authorization, patient-only revocation, contract tests | Contract is not formally verified or professionally audited |
| Global admin privilege | A universal admin becomes a high-impact mutation path | No global medical-record admin role exists | Real institutional governance is out of scope |
| Frontend XSS | User or chain values can become script input | Dynamic values use `textContent`; CSP and defensive browser headers are sent | Third-party wallet extensions and the ethers CDN remain browser trust dependencies |
| API credential leakage | Public credentials can be abused and billed | `.env` is ignored; only `.env.example` is tracked | Historical leaked credentials must be revoked separately |
| AI hallucination or overconfidence | Unsafe in health contexts | Non-diagnostic instructions, explicit disclaimer, clinician-oriented framing, endpoint tests | Model output can still be wrong; do not use it for care decisions |
| Silent AI data transmission | Health information is sensitive | Explicit consent field and UI checkbox; no request-body logs | External provider handling is governed by provider terms/policies |
| Denial of service / API abuse | Cost and availability risk | Input bounds, 16 KB body limit, rate limiting with stale-bucket cleanup | In-memory limiter is single-instance only |

## Non-goals

This repository does not claim HIPAA, GDPR, KVKK, medical-device, clinical-validation, hospital-interoperability, or production security compliance.
