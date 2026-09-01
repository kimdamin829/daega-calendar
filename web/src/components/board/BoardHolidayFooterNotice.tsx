import { BOARD_FONT } from "@/lib/boardTableTheme";

/** 연휴 공지 — 끝나면 이 파일과 사용처 footer 블록 통째로 삭제 */
export const BOARD_HOLIDAY_FOOTER_TEXT = "추석 연휴 정상영업합니다.";
const BOARD_HOLIDAY_FOOTER_ACCENT = "#dc2626";

interface BoardHolidayFooterNoticeProps {
  textClassName?: string;
  starClassName?: string;
  maxWidthClassName?: string;
}

export function BoardHolidayFooterNotice({
  textClassName = `text-[46px] leading-snug tracking-wide ${BOARD_FONT}`,
  starClassName = "text-[32px]",
  maxWidthClassName = "max-w-[1500px]",
}: BoardHolidayFooterNoticeProps) {
  return (
    <div className={`flex w-full ${maxWidthClassName} items-center justify-center gap-4 px-8`}>
      <div className="h-px flex-1" style={{ backgroundColor: BOARD_HOLIDAY_FOOTER_ACCENT }} />
      <span
        aria-hidden
        className={`shrink-0 leading-none ${starClassName}`}
        style={{ color: BOARD_HOLIDAY_FOOTER_ACCENT }}
      >
        ✦
      </span>
      <p className={`shrink-0 ${textClassName}`}>{BOARD_HOLIDAY_FOOTER_TEXT}</p>
      <span
        aria-hidden
        className={`shrink-0 leading-none ${starClassName}`}
        style={{ color: BOARD_HOLIDAY_FOOTER_ACCENT }}
      >
        ✦
      </span>
      <div className="h-px flex-1" style={{ backgroundColor: BOARD_HOLIDAY_FOOTER_ACCENT }} />
    </div>
  );
}
