# Threat Model

| Risk | Why it matters | Mitigation in this prototype | Remaining limitation |
| --- | --- | --- | --- |
| Plaintext health data on-chain | Public and effectively permanent disclosure | Only salted `bytes32` digests and hashed categories are stored | Metadata such as wallet, author, time, and transaction patterns remain public |
| Dictionary attack against record hash | Small medical terms are guessable | Random 32-byte client-side salt | Proof bundle must remain private |
| Unauthorized record mutation | A malicious wallet could alter patient history | Append-only records, provider authorization, patient-only revocation, contract tests | Contract is not formally verified or audited |
| Fake "admin" privilege | Unrestricted admin functions can become universal write access | No global medical-record admin role | Governance for real institutions is out of scope |
| Frontend XSS | On-chain/user data can become script input | Dynamic values are rendered with `textContent`, not raw HTML | Third-party browser extensions/CDNs remain part of the browser trust boundary |
| API credential leakage | Public keys can be abused and billed | `.env` is ignored; only `.env.example` is tracked | Historical leaked credentials must be revoked separately |
| AI hallucination or overconfidence | Unsafe in health contexts | Non-diagnostic system instructions, explicit disclaimer, human-clinician framing | Model output can still be wrong; do not use for care decisions |
| Silent AI data transmission | Health information is sensitive | Explicit consent field and UI checkbox; no request-body logs | External provider data handling is governed by provider terms/policies |
| Denial of service / API abuse | Cost and availability risk | Input bounds, 16 KB body limit, basic rate limiting | In-memory limiter is single-instance only |

## Non-goals

This repository does not claim HIPAA, GDPR, KVKK, medical-device, clinical-validation, hospital-interoperability, or production security compliance.
