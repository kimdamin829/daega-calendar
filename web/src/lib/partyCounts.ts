export type PartySeparator = "." | "," | "&";

export interface PartyCounts {
  adult_count: number;
  child_count: number;
  infant_count: number;
}

export interface ParsedPartyCounts extends PartyCounts {
  party_separator: PartySeparator | null;
}

export type PartyTier = 1 | 2 | 3;

export class PartyCountParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PartyCountParseError";
  }
}

const PARTY_PARSE_HINT =
  "인원수 형식이 올바르지 않습니다. (예: 4, 4명, 10.2명, 10&1명, 10.2,1명)";

export const DEFAULT_PARTY_COUNTS: PartyCounts = {
  adult_count: 1,
  child_count: 0,
  infant_count: 0,
};

export function getPartyTier(counts: PartyCounts): PartyTier {
  if (counts.infant_count > 0) return 3;
  if (counts.child_count > 0) return 2;
  return 1;
}

/** 4 / 4명 / 10.2 / 10&1 / 10.2,1 / 10.2.1명 → adult·child·infant + 구분자 */
export function parsePartyCounts(raw: string): ParsedPartyCounts {
  const cleaned = raw.replace(/명$/, "").trim();
  if (!cleaned) {
    throw new PartyCountParseError(PARTY_PARSE_HINT);
  }

  const party_separator = detectPartySeparator(cleaned);

  const segments = cleaned.split(/[.,&]+/);
  if (segments.length > 3) {
    throw new PartyCountParseError(PARTY_PARSE_HINT);
  }

  const numbers = segments.map((segment) => {
    if (!/^\d+$/.test(segment)) {
      throw new PartyCountParseError(PARTY_PARSE_HINT);
    }
    return Number(segment);
  });

  const adult_count = numbers[0] ?? 0;
  const child_count = numbers[1] ?? 0;
  const infant_count = numbers[2] ?? 0;

  if (adult_count + child_count + infant_count <= 0) {
    throw new PartyCountParseError("인원수는 1명 이상이어야 합니다.");
  }

  return { adult_count, child_count, infant_count, party_separator };
}

function detectPartySeparator(raw: string): PartySeparator | null {
  const match = raw.match(/[.,&]/);
  return match ? (match[0] as PartySeparator) : null;
}

export function shouldShowPartyLabel(counts: PartyCounts): boolean {
  return counts.child_count > 0 || counts.infant_count > 0 || counts.adult_count > 1;
}

export function formatPartyLabel(
  counts: PartyCounts,
  separator: PartySeparator | null = ".",
): string {
  if (counts.child_count === 0 && counts.infant_count === 0) {
    return `${counts.adult_count}명`;
  }

  const parts = [counts.adult_count, counts.child_count];
  if (counts.infant_count > 0) {
    parts.push(counts.infant_count);
  }

  const sep = separator ?? ".";
  return `${parts.join(sep)}명`;
}

/** 현황판용 — 성인·소인·유아 숫자 배열 (표시 시 &로 연결) */
export function getBoardPartyParts(counts: PartyCounts): string[] {
  const tier = getPartyTier(counts);
  if (tier === 3) {
    return [
      String(counts.adult_count),
      String(counts.child_count),
      String(counts.infant_count),
    ];
  }
  if (tier === 2) {
    return [String(counts.adult_count), String(counts.child_count)];
  }
  return [String(counts.adult_count)];
}
