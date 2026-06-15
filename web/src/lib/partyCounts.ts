export interface PartyCounts {
  adult_count: number;
  child_count: number;
  infant_count: number;
}

export class PartyCountParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PartyCountParseError";
  }
}

export function getPartySize(counts: PartyCounts): number {
  return counts.adult_count + counts.child_count + counts.infant_count;
}

export function toPartyCounts(partySize: number): PartyCounts {
  return {
    adult_count: Math.max(0, partySize),
    child_count: 0,
    infant_count: 0,
  };
}

export const DEFAULT_PARTY_COUNTS: PartyCounts = {
  adult_count: 1,
  child_count: 0,
  infant_count: 0,
};

/** 4 / 4명 / 10.2 / 10.2명 / 10.2.1명 → adult·child·infant */
export function parsePartyCounts(raw: string): PartyCounts {
  const cleaned = raw.replace(/명$/, "").trim();
  if (!cleaned) {
    throw new PartyCountParseError("인원수 형식이 올바르지 않습니다. (예: 4, 4명, 10.2명)");
  }

  const segments = cleaned.split(".");
  if (segments.length > 3) {
    throw new PartyCountParseError("인원수 형식이 올바르지 않습니다. (예: 4, 4명, 10.2명)");
  }

  const numbers = segments.map((segment) => {
    if (!/^\d+$/.test(segment)) {
      throw new PartyCountParseError("인원수 형식이 올바르지 않습니다. (예: 4, 4명, 10.2명)");
    }
    return Number(segment);
  });

  const adult_count = numbers[0] ?? 0;
  const child_count = numbers[1] ?? 0;
  const infant_count = numbers[2] ?? 0;

  if (getPartySize({ adult_count, child_count, infant_count }) <= 0) {
    throw new PartyCountParseError("인원수는 1명 이상이어야 합니다.");
  }

  return { adult_count, child_count, infant_count };
}

export function shouldShowPartyLabel(counts: PartyCounts): boolean {
  return counts.child_count > 0 || counts.infant_count > 0 || counts.adult_count > 1;
}

export function formatPartyLabel(counts: PartyCounts): string {
  if (counts.child_count === 0 && counts.infant_count === 0) {
    return `${counts.adult_count}명`;
  }

  const parts = [counts.adult_count, counts.child_count];
  if (counts.infant_count > 0) {
    parts.push(counts.infant_count);
  }

  return `${parts.join(".")}명`;
}
