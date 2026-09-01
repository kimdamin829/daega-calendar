import { STATUS_FRAME_BORDER } from "@/lib/statusDisplayTheme";

export function StatusTitleDivider({
  variant = "board",
  className = "",
}: {
  variant?: "board" | "today";
  className?: string;
}) {
  const compact = variant === "today";

  return (
    <div
      className={
        compact
          ? `flex shrink-0 items-center justify-center px-8 py-4 ${className}`
          : `flex shrink-0 items-center justify-center px-32 pb-5 ${className}`
      }
    >
      <div className="h-px flex-1" style={{ backgroundColor: STATUS_FRAME_BORDER }} />
      <div
        className={compact ? "mx-3 h-1.5 w-1.5 rotate-45" : "mx-4 h-2 w-2 rotate-45"}
        style={{ backgroundColor: STATUS_FRAME_BORDER }}
      />
      <div className="h-px flex-1" style={{ backgroundColor: STATUS_FRAME_BORDER }} />
    </div>
  );
}
