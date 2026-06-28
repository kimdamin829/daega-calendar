import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Reservation } from "@/types/reservation";
import { isPlaceholderReservation } from "@/lib/reservationDisplay";
import {
  COLOR_SWATCHES,
  isDefaultColor,
  type ReservationColor,
} from "@/lib/reservationColors";

function readDeleteModalFrame() {
  const viewport = window.visualViewport;
  if (!viewport) {
    return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
  }
  return {
    top: viewport.offsetTop,
    left: viewport.offsetLeft,
    width: viewport.width,
    height: viewport.height,
  };
}

export interface ReservationEditorHandle {
  dismiss: () => Promise<void>;
}

interface ReservationEditorProps {
  reservation: Reservation;
  value: string;
  onChange: (raw: string) => void;
  onSave: (raw: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onColorChange: (color: ReservationColor | null) => Promise<void>;
  onDismissRequest: () => void;
}

export const ReservationEditor = forwardRef<ReservationEditorHandle, ReservationEditorProps>(
  function ReservationEditor(
    { reservation, value, onChange, onSave, onDelete, onColorChange, onDismissRequest },
    ref,
  ) {
    const panelRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [color, setColor] = useState<ReservationColor | null>(reservation.color);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const deleteConfirmRef = useRef(false);
    deleteConfirmRef.current = deleteConfirm;
    const [deleteModalFrame, setDeleteModalFrame] = useState(readDeleteModalFrame);

    const closeDeleteConfirm = useCallback(() => {
      setDeleteConfirm(false);
      window.requestAnimationFrame(() => {
        inputRef.current?.focus({ preventScroll: true });
      });
    }, []);

    useEffect(() => {
      setColor(reservation.color);
      setError(null);
      setDeleteConfirm(false);
    }, [reservation.id, reservation.color]);

    useEffect(() => {
      if (deleteConfirm) return;

      const focusInput = () => {
        const input = inputRef.current;
        if (!input) return;
        input.focus({ preventScroll: true });
        const end = input.value.length;
        input.setSelectionRange(end, end);
        input.scrollIntoView({ block: "nearest", inline: "nearest" });
      };

      const frame = window.requestAnimationFrame(focusInput);
      const timer = window.setTimeout(focusInput, 120);
      return () => {
        window.cancelAnimationFrame(frame);
        window.clearTimeout(timer);
      };
    }, [reservation.id, deleteConfirm]);

    useEffect(() => {
      if (!deleteConfirm) return;

      inputRef.current?.blur();

      const updateFrame = () => setDeleteModalFrame(readDeleteModalFrame());
      updateFrame();
      window.visualViewport?.addEventListener("resize", updateFrame);
      window.visualViewport?.addEventListener("scroll", updateFrame);
      return () => {
        window.visualViewport?.removeEventListener("resize", updateFrame);
        window.visualViewport?.removeEventListener("scroll", updateFrame);
      };
    }, [deleteConfirm]);

    useEffect(() => {
      if (!deleteConfirm) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape" && !busy) closeDeleteConfirm();
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [deleteConfirm, busy, closeDeleteConfirm]);

    const dismiss = async () => {
      if (busy || deleteConfirm) return;

      const trimmed = value.trim();
      setBusy(true);
      setError(null);

      try {
        if (trimmed) {
          await onSave(trimmed);
        } else if (isPlaceholderReservation(reservation)) {
          await onDelete();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
        throw err;
      } finally {
        setBusy(false);
      }
    };

    useImperativeHandle(ref, () => ({ dismiss }), [value, reservation, busy, deleteConfirm]);

    const handleDeleteClick = () => {
      if (busy) return;
      inputRef.current?.blur();
      setError(null);
      setDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
      if (busy) return;
      setBusy(true);
      setError(null);
      try {
        await onDelete();
      } catch (err) {
        setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
        setDeleteConfirm(false);
      } finally {
        setBusy(false);
      }
    };

    const handleColorSelect = async (next: ReservationColor | null) => {
      setColor(next);
      try {
        await onColorChange(next);
      } catch {
        setColor(reservation.color);
      }
    };

    const keepFocus = (event: React.PointerEvent) => {
      event.preventDefault();
    };

    const handleInputBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      if (deleteConfirm) return;

      const related = event.relatedTarget;
      if (related instanceof Node && panelRef.current?.contains(related)) return;

      window.setTimeout(() => {
        if (deleteConfirmRef.current) return;
        if (panelRef.current?.contains(document.activeElement)) return;
        onDismissRequest();
      }, 0);
    };

    const deleteConfirmModal =
      deleteConfirm &&
      createPortal(
        <div
          className="fixed z-[70] flex items-center justify-center bg-black/40 px-6"
          style={{
            top: deleteModalFrame.top,
            left: deleteModalFrame.left,
            width: deleteModalFrame.width,
            height: deleteModalFrame.height,
          }}
          onClick={() => {
            if (!busy) closeDeleteConfirm();
          }}
          role="presentation"
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-reservation-title"
          >
            <p
              id="delete-reservation-title"
              className="text-center text-base font-medium text-[#3c4043]"
            >
              정말로 삭제하시겠습니까?
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={closeDeleteConfirm}
                className="flex-1 rounded-xl border border-gcal-border py-3 text-base font-medium text-[#3c4043] hover:bg-[#f1f3f4] disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleDeleteConfirm()}
                className="flex-1 rounded-xl bg-red-600 py-3 text-base font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                확인
              </button>
            </div>
          </div>
        </div>,
        document.body,
      );

    return (
      <>
        <div ref={panelRef} className="w-full">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <p className="shrink-0 text-base font-medium text-[#3c4043]">예약</p>
            <div className="flex items-center gap-2">
              {COLOR_SWATCHES.map((option) => (
                <button
                  key={option.id ?? "none"}
                  type="button"
                  disabled={busy}
                  onPointerDown={keepFocus}
                  onClick={() => void handleColorSelect(option.id)}
                  className={[
                    "h-8 w-8 shrink-0 rounded-full",
                    option.swatch,
                    (option.id === null ? isDefaultColor(color) : color === option.id)
                      ? `ring-2 ring-offset-1 ${option.ring}`
                      : "",
                  ].join(" ")}
                  aria-label={option.label}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            disabled={busy || deleteConfirm}
            onClick={handleDeleteClick}
            className="shrink-0 text-base text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            삭제
          </button>
        </div>

        <input
          ref={inputRef}
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setError(null);
          }}
          onBlur={handleInputBlur}
          onPointerDown={(event) => event.stopPropagation()}
          placeholder="7:00 4명 김다민 VIP1"
          disabled={busy || deleteConfirm}
          className="w-full rounded-xl border border-gcal-border px-4 py-4 text-base outline-none focus:border-gcal-blue focus:ring-2 focus:ring-gcal-blue/20"
        />

        {error && (
          <p className="mt-4 whitespace-pre-line text-sm text-red-600">{error}</p>
        )}
        </div>
        {deleteConfirmModal}
      </>
    );
  },
);
