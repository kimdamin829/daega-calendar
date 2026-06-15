export interface PartyCounts {
  adult_count: number;
  child_count: number;
  infant_count: number;
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
