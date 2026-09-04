/**
 * Ploxi signing chain — reference verification implementation.
 * Extracted from the Ploxi Earth platform signing engine; kept here so anyone
 * can audit and independently verify the public signing log.
 *
 * Scheme: record_hash = SHA-256( prev_hash | agreement_id | event | doc_sha256 | created_at )
 * The first event's prev_hash is the literal string "GENESIS".
 */

export interface PublicSignatureEvent {
  agreement_id: string;
  event: 'vendor_signed' | 'countersigned';
  doc_sha256: string;
  prev_hash: string | null;
  record_hash: string;
  created_at: string;
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function computeRecordHash(
  prevHash: string | null,
  agreementId: string,
  event: string,
  docSha256: string,
  createdAt: string
): Promise<string> {
  return sha256Hex(
    `${prevHash || 'GENESIS'}|${agreementId}|${event}|${docSha256}|${createdAt}`
  );
}

export interface ChainVerification {
  ok: boolean;
  head: string | null;
  eventCount: number;
  brokenAt?: string;
}

/** Recompute the whole chain and check every link. */
export async function verifyChain(events: PublicSignatureEvent[]): Promise<ChainVerification> {
  let prev: string | null = null;
  for (const e of events) {
    const recomputed = await computeRecordHash(prev, e.agreement_id, e.event, e.doc_sha256, e.created_at);
    if (recomputed !== e.record_hash || e.prev_hash !== prev) {
      return { ok: false, head: null, eventCount: events.length, brokenAt: e.record_hash };
    }
    prev = e.record_hash;
  }
  return { ok: true, head: prev, eventCount: events.length };
}

/** SHA-256 of a document (browser/Node buffer). */
export async function fingerprintDocument(bytes: ArrayBuffer | Uint8Array): Promise<string> {
  const buf = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Does this document fingerprint appear in the public log? */
export function findEventsForDocument(
  events: PublicSignatureEvent[],
  docSha256: string
): PublicSignatureEvent[] {
  return events.filter((e) => e.doc_sha256 === docSha256.toLowerCase());
}
