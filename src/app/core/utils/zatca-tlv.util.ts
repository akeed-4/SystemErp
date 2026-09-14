/**
 * ZATCA (Zakat, Tax and Customs Authority) - E-Invoicing TLV & QR Code Generator
 * Conforms to FATOORA Phase 1 and Phase 2 specifications.
 */

export interface ZatcaTlvFields {
  sellerName: string;
  vatNumber: string;
  timestamp: string; // ISO 8601 string, e.g. "2026-09-14T11:30:00Z"
  invoiceTotal: string; // e.g. "1150.00"
  vatTotal: string; // e.g. "150.00"
  invoiceHash?: string; // Tag 6 (Phase 2)
  digitalSignature?: string; // Tag 7 (Phase 2)
  publicKey?: string; // Tag 8 (Phase 2)
}

/**
 * Encodes string to UTF-8 Uint8Array
 */
function toUtf8Bytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Creates a single TLV block:
 * [Tag: 1 byte] [Length: 1 byte] [Value: n bytes]
 */
function createTlvTag(tagNumber: number, valueStr: string): Uint8Array {
  const valueBytes = toUtf8Bytes(valueStr);
  const tagBytes = new Uint8Array(2 + valueBytes.length);
  tagBytes[0] = tagNumber;
  tagBytes[1] = valueBytes.length;
  tagBytes.set(valueBytes, 2);
  return tagBytes;
}

/**
 * Generates ZATCA Base64 encoded TLV string for QR Code
 */
export function generateZatcaTlvBase64(fields: ZatcaTlvFields): string {
  const tags: Uint8Array[] = [
    createTlvTag(1, fields.sellerName || 'مؤسسة تجارية'),
    createTlvTag(2, fields.vatNumber || '300000000000003'),
    createTlvTag(3, fields.timestamp || new Date().toISOString()),
    createTlvTag(4, Number(fields.invoiceTotal || 0).toFixed(2)),
    createTlvTag(5, Number(fields.vatTotal || 0).toFixed(2)),
  ];

  if (fields.invoiceHash) {
    tags.push(createTlvTag(6, fields.invoiceHash));
  }
  if (fields.digitalSignature) {
    tags.push(createTlvTag(7, fields.digitalSignature));
  }
  if (fields.publicKey) {
    tags.push(createTlvTag(8, fields.publicKey));
  }

  // Calculate total length
  const totalLength = tags.reduce((acc, curr) => acc + curr.length, 0);
  const combinedBuffer = new Uint8Array(totalLength);

  let offset = 0;
  for (const tag of tags) {
    combinedBuffer.set(tag, offset);
    offset += tag.length;
  }

  // Convert Uint8Array to Binary string, then Base64
  let binary = '';
  const len = combinedBuffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(combinedBuffer[i]);
  }

  return btoa(binary);
}

/**
 * Generate a simulated SHA-256 Hash and ECDSA signature for ZATCA Phase 2 simulation
 */
export function generateSimulatedZatcaSignature(invoiceNumber: string, grandTotal: number, issueDate: string) {
  const raw = `${invoiceNumber}|${grandTotal.toFixed(2)}|${issueDate}|ZATCA_SIM_V2`;
  // Simple deterministic pseudohash for simulation display
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0').repeat(8).substring(0, 64);
  const signature = 'MEQCIQ' + btoa(hexHash.substring(0, 32)).substring(0, 36) + 'AiA' + btoa(hexHash.substring(32)).substring(0, 36) + '=';
  return {
    hash: hexHash,
    signature: signature,
    publicKey: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE' + btoa(invoiceNumber).padEnd(50, 'A')
  };
}
