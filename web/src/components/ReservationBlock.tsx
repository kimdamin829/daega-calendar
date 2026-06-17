import { useRef } from "react";
import type { Reservation } from "@/types/reservation";
import type { BlockLayout } from "@/lib/overlapLayout";
import { durationToHeight, minutesToY } from "@/lib/dayGrid";
import { formatReservationDisplay } from "@/lib/reservationDisplay";
import { getColorStyles } from "@/lib/reservationColors";

interface ReservationBlockProps {
  reservation: Reservation;
  layout: BlockLayout;
  isDragging: boolean;
  isRepositioning?: boolean;
  isPending?: boolean;
  isEditing?: boolean;
  liveText?: string;
  dragOffsetY: number;
  repositionOffsetY?: number;
  onDragStart: (id: string, clientY: number) => void;
  onDragMove: (clientY: number) => void;
  onDragEnd: (id: string) => void;
  onSelect: (id: string) => void;
}

const DRAG_THRESHOLD = 10;
const HORIZONTAL_GAP = 4;

export function ReservationBlock({
  reservation,
  layout,
  isDragging,
  isRepositioning = false,
  isPending = false,
  isEditing = false,
  liveText,
  dragOffsetY,
  repositionOffsetY = 0,
  onDragStart,
  onDragMove,
  onDragEnd,
  onSelect,
}: ReservationBlockProps) {
  const pointerStart = useRef({ x: 0, y: 0 });
  const dragStarted = useRef(false);
  const didDragRef = useRef(false);
  const colorStyles = getColorStyles(reservation.color);
  const displayText = isEditing
    ? liveText
    : formatReservationDisplay(reservation);

  const visualOffsetY = isDragging ? dragOffsetY : isRepositioning ? repositionOffsetY : 0;
  const top = minutesToY(reservation.start_minutes);
  const height = Math.max(durationToHeight(reservation.duration_minutes) - 2, 24);
  const widthPercent = 100 / layout.totalColumns;
  const leftPercent = layout.column * widthPercent;
  const isMoving = isDragging || isRepositioning;

  return (
    <div
      role="button"
      tabIndex={0}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: `calc(${leftPercent}% + ${HORIZONTAL_GAP / 2}px)`,
        width: `calc(${widthPercent}% - ${HORIZONTAL_GAP}px)`,
        transform: visualOffsetY ? `translateY(${visualOffsetY}px)` : undefined,
        willChange: isMoving ? "transform" : undefined,
      }}
      className={[
        "absolute overflow-hidden rounded border px-2 py-1 text-left text-sm shadow-sm touch-none touch-manipulation",
        colorStyles.block,
        isMoving
          ? "z-30 shadow-md"
          : isPending || isEditing
            ? "z-20 shadow-md"
            : "z-10 cursor-grab hover:shadow",
        isDragging ? "cursor-grabbing opacity-90" : "",
        isPending || isEditing || !displayText ? "border-2 border-dashed" : "",
        isEditing ? "ring-2 ring-gcal-blue/50" : "",
        isPending ? "ring-2 ring-gcal-blue/30" : "",
      ].join(" ")}
      onPointerDown={(event) => {
        event.stopPropagation();
        pointerStart.current = { x: event.clientX, y: event.clientY };
        dragStarted.current = false;
        didDragRef.current = false;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const dx = event.clientX - pointerStart.current.x;
        const dy = event.clientY - pointerStart.current.y;

        if (!dragStarted.current && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
          dragStarted.current = true;
          didDragRef.current = true;
          onDragStart(reservation.id, event.clientY);
        }

        if (dragStarted.current) {
          onDragMove(event.clientY);
        }
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
        event.currentTarget.releasePointerCapture(event.pointerId);

        const wasDrag = dragStarted.current;
        dragStarted.current = false;

        if (wasDrag) {
          void onDragEnd(reservation.id);
        }
      }}
      onClick={(event) => {
        event.stopPropagation();
        if (didDragRef.current) {
          didDragRef.current = false;
          return;
        }
        onSelect(reservation.id);
      }}
      onPointerCancel={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        dragStarted.current = false;
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(reservation.id);
        }
      }}
    >
      {displayText ? (
        <span className="line-clamp-3 text-sm font-bold leading-tight">{displayText}</span>
      ) : !isEditing ? (
        <span className="text-[10px] opacity-60">탭해서 입력</span>
      ) : null}
    </div>
  );
}
