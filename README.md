# Ploxi Signing Log

Public, tamper-evident log of electronic signatures executed on the
[Ploxi Earth](https://www.ploxi.earth) platform.

- **Verify a signed PDF:** open the [verification page](https://verify.ploxi.earth) and drop in your document. The file is hashed in your browser and never uploaded.
- **How it works:** [SPEC.md](SPEC.md) - the hash-chain scheme, the published fields, and what verification does (and does not) prove.
- **Open source logic:** [open/chain-verification.ts](open/chain-verification.ts) - the reference implementation, extracted from the platform's signing engine.

Every document signed on Ploxi (starting with vendor NDAs) records each signature
event in a hash chain: each record's fingerprint is derived from the previous one, so
altering or deleting any record breaks the chain visibly. This repository receives the
full public log and the current chain head daily. GitHub's server-side commit history
dates each publication, which means past records cannot be quietly rewritten.

Privacy: signer names, emails, IP addresses and device evidence are **not** published
here. They are recorded privately on the platform and printed inside the signed PDF's
Electronic Signature Audit Certificate page, which travels with the document itself.

Questions: support@ploxi.earth
