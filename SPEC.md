# Ploxi Signing Log — Specification

This repository is the **public, tamper-evident log of electronic signatures** executed on
the Ploxi Earth platform (ploxi.earth). It exists so that the authenticity of a signed
document can be checked by anyone, without trusting Ploxi's own database.

## Files

| File | Contents |
|---|---|
| `events.jsonl` | One JSON line per signature event, in chain order. Updated daily. |
| `anchors.jsonl` | One JSON line per day: the chain head at publication time, dated by GitHub's commit history. |
| `index.html` | Browser-based verifier (also served at the GitHub Pages URL). Files are hashed locally; nothing is uploaded. |
| `open/chain-verification.ts` | Open-source reference implementation of the hashing scheme, extracted verbatim from the platform's signing engine. |

## Event record (public fields only)

```json
{
  "agreement_id": "uuid",
  "event": "vendor_signed | countersigned",
  "doc_sha256": "sha256 hex of the signed PDF served to the signer",
  "prev_hash": "record_hash of the previous event (null = first event)",
  "record_hash": "see scheme below",
  "created_at": "ISO-8601 UTC timestamp"
}
```

Signer names, emails, IP addresses and other evidence are recorded privately on the
platform (and printed inside the signed PDF's audit certificate page) but are
deliberately **not** published here.

## Hash-chain scheme

```
record_hash = SHA-256( prev_hash | agreement_id | event | doc_sha256 | created_at )
```

- `prev_hash` of the first event is the literal string `GENESIS`.
- Each event's `prev_hash` must equal the previous event's `record_hash`.
- Changing or deleting any historical event changes every subsequent `record_hash`,
  which stops matching the published anchors. Adding fake events is detectable because
  the anchor (dated by GitHub's server-side commit history) no longer matches.

## What verification proves

- A PDF whose SHA-256 appears in `events.jsonl` was signed on the Ploxi platform, and
  the record of that signature has not been altered since the first anchor after its
  inclusion.
- Existence timing is daily-granular (the anchor date). The signed PDF itself carries
  per-signature timestamps in its audit certificate page.

## Verification

Open `index.html` (or the GitHub Pages site), drop in the signed PDF, and read the
result. Or verify manually:

```bash
# fingerprint of your document
shasum -a 256 your-signed.pdf

# check membership + recompute the chain
python3 - <<'EOF'
import json, hashlib
events = [json.loads(l) for l in open('events.jsonl') if l.strip()]
prev = None
for e in events:
    h = hashlib.sha256(('GENESIS' if prev is None else prev).encode() +
        f"|{e['agreement_id']}|{e['event']}|{e['doc_sha256']}|{e['created_at']}".encode()).hexdigest()
    assert h == e['record_hash'] and e['prev_hash'] == prev, 'CHAIN BROKEN'
    prev = h
print('chain OK,', len(events), 'events, head:', prev[:16], '...')
EOF
```
