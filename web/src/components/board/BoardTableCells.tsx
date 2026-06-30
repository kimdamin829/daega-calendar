import type { PartyTier } from "@/lib/partyCounts";
import type { BoardTableTypography } from "@/lib/boardTableTheme";
import { BOARD_FONT, NAME_SPACED_CHARS } from "@/lib/boardTableTheme";

export function BoardPartyLabel({
  partyParts,
  typography,
}: {
  partyParts: string[];
  typography: BoardTableTypography;
}) {
  const partyTier = partyParts.length as PartyTier;

  return (
    <span className={BOARD_FONT}>
      {partyParts.map((part, index) => (
        <span key={index}>
          {index > 0 && <span className={typography.suffixText}>&</span>}
          <span className={typography.partyText[partyTier]}>{part}</span>
        </span>
      ))}
      <span className={typography.suffixText}>명</span>
    </span>
  );
}

export function BoardGuestNameCell({
  guestNameChars,
  typography,
}: {
  guestNameChars: string[];
  typography: BoardTableTypography;
}) {
  return (
    <span className={`${typography.cellText} inline-flex items-baseline justify-center`}>
      <span className={NAME_SPACED_CHARS}>
        {guestNameChars.map((char, index) => (
          <span key={`${char}-${index}`}>{char}</span>
        ))}
      </span>
      <span className={typography.suffixText}>님</span>
    </span>
  );
}

export function BoardTableError({ error }: { error: string | null }) {
  if (!error) return null;

  return (
    <p className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 text-center text-[22px] text-red-600">
      {error}
    </p>
  );
}
