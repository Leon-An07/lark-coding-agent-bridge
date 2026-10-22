import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function tsFiles(path: string): string[] {
  const full = join(root, path);
  if (!existsSync(full)) return [];
  if (statSync(full).isFile()) return path.endsWith('.ts') ? [path] : [];
  return readdirSync(full).flatMap((entry) => tsFiles(join(path, entry)));
}

// A quoted string with a CJK char, on a line that is not a comment.
const CJK_LITERAL = /(['"`])(?:(?!\1).)*[一-鿿぀-ヿ](?:(?!\1).)*\1/;

describe('user-facing CLI text goes through the i18n catalogs', () => {
  it('has no CJK string literals in CLI, daemon, runtime, or web API code', () => {
    const offenders: string[] = [];
    for (const file of ['src/cli', 'src/daemon', 'src/runtime', 'src/ui', 'src/platform'].flatMap(tsFiles)) {
      readFileSync(join(root, file), 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
          if (CJK_LITERAL.test(line)) offenders.push(`${file}:${i + 1}`);
        });
    }
    expect(offenders, 'move these strings into src/i18n/catalog (zh/en/ja)').toEqual([]);
  });
});
