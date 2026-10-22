/**
 * Decode bytes captured from a child process.
 *
 * On CJK Windows, console tools (schtasks, cmd built-ins, npm lifecycle
 * scripts) write the OEM codepage (CP932 on Japanese, CP936/GBK on Chinese),
 * while node-based tools write UTF-8, often mixed in one stream. Decoding
 * everything as UTF-8 turns the OEM parts into U+FFFD mojibake.
 *
 * Decoding is per line: a line that is valid UTF-8 stays UTF-8, any other
 * line is decoded with the OEM codepage. Splitting on 0x0A is safe because
 * that byte is never a trail byte in Shift_JIS, GBK, Big5 or EUC-KR.
 */
import { spawnSync } from 'node:child_process';

/** Windows codepage number → WHATWG encoding label understood by TextDecoder. */
const CODEPAGE_LABELS: Record<number, string> = {
  932: 'shift_jis',
  936: 'gbk',
  949: 'euc-kr',
  950: 'big5',
  866: 'ibm866',
  1250: 'windows-1250',
  1251: 'windows-1251',
  1252: 'windows-1252',
  1253: 'windows-1253',
  1254: 'windows-1254',
  1255: 'windows-1255',
  1256: 'windows-1256',
  1257: 'windows-1257',
  1258: 'windows-1258',
  65001: 'utf-8',
};

const utf8Strict = new TextDecoder('utf-8', { fatal: true });
const utf8Lenient = new TextDecoder('utf-8');

function fallbackDecoder(codepage: number | undefined): { decode(input: Uint8Array): string } | undefined {
  const label = codepage === undefined ? undefined : CODEPAGE_LABELS[codepage];
  if (!label || label === 'utf-8') return undefined;
  try {
    return new TextDecoder(label);
  } catch {
    // Node built with small-icu has no legacy CJK decoders.
    return undefined;
  }
}

/** Pure: decode `bytes`, using `codepage` for lines that are not UTF-8. */
export function decodeConsoleBytes(bytes: Uint8Array, codepage: number | undefined): string {
  const legacy = fallbackDecoder(codepage);
  if (!legacy) return utf8Lenient.decode(bytes);
  const parts: string[] = [];
  let start = 0;
  while (start <= bytes.length) {
    const nl = bytes.indexOf(0x0a, start);
    const end = nl === -1 ? bytes.length : nl + 1;
    const line = bytes.subarray(start, end);
    try {
      parts.push(utf8Strict.decode(line));
    } catch {
      parts.push(legacy.decode(line));
    }
    if (nl === -1) break;
    start = end;
  }
  return parts.join('');
}

let cachedOemCodepage: number | null | undefined;

/** OEM codepage of this Windows install (from the registry), or undefined. */
export function windowsOemCodepage(): number | undefined {
  if (process.platform !== 'win32') return undefined;
  if (cachedOemCodepage === undefined) {
    cachedOemCodepage = null;
    try {
      const r = spawnSync(
        'reg',
        ['query', 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\Nls\\CodePage', '/v', 'OEMCP'],
        { encoding: 'latin1', windowsHide: true, timeout: 5000 },
      );
      const cp = Number(/OEMCP\s+REG_SZ\s+(\d+)/i.exec(r.stdout ?? '')?.[1]);
      if (Number.isInteger(cp) && cp > 0) cachedOemCodepage = cp;
    } catch {
      // keep null: decode as UTF-8
    }
  }
  return cachedOemCodepage ?? undefined;
}

/** Decode child-process output captured on this machine. */
export function decodeChildOutput(bytes: Uint8Array | string | null | undefined): string {
  if (bytes == null) return '';
  if (typeof bytes === 'string') return bytes;
  return decodeConsoleBytes(bytes, windowsOemCodepage());
}
