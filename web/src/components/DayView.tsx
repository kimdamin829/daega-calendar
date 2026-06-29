import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Reservation } from "@/types/reservation";
import type { ReservationColor } from "@/lib/reservationColors";
import { ReservationBlock } from "@/components/ReservationBlock";
import {
  ReservationEditor,
  type ReservationEditorHandle,
} from "@/components/ReservationEditor";
import { createPendingReservation } from "@/lib/createPendingReservation";
import {
  formatReservationDisplay,
  shouldShowOnDayTimeline,
} from "@/lib/reservationDisplay";
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe";
import { useRafValue } from "@/hooks/useRafValue";
import { formatSelectedDateTitle, toDateString } from "@/lib/dateUtils";
import { getStoreBrandLabel } from "@/lib/storeId";
import {
  clampMinutes,
  DEFAULT_DURATION,
  durationToHeight,
  formatHourLabel,
  HOUR_HEIGHT,
  getGridHeight,
  getTimelineContentOffsetY,
  minutesToY,
  offsetYToSnappedMinutes,
  SNAP_MINUTES,
  TIMELINE_HOUR_COUNT,
  TIMELINE_END_HOUR,
  TIMELINE_PADDING_ROWS,
  TIMELINE_START_HOUR,
  yToMinutes,
} from "@/lib/dayGrid";
import { layoutReservations } from "@/lib/overlapLayout";
import { compareReservationsByTime } from "@/lib/reservationSort";
import { useVisualViewportLayout } from "@/lib/viewportHeight";

interface DayViewProps {
  date: Date;
  reservations: Reservation[];
  error: string | null;
  onBack: () => void;
  onUpdatePosition: (
    id: string,
    startMinutes: number,
    durationMinutes: number,
  ) => Promise<void>;
  onSaveContent: (draft: Reservation, raw: string) => Promise<Reservation>;
  onUpdateColor: (id: string, color: ReservationColor | null) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onPreviousDay: () => void;
  onNextDay: () => void;
}

const TAP_THRESHOLD = 10;
const GRID_WARMUP_MS = 500;
const ZOOM_STORAGE_KEY = "day-view-zoom";
const DAY_VIEW_MIN_ZOOM = 0.65;
const DAY_VIEW_MAX_ZOOM = 2.2;
const EMPTY_GRID_GESTURE = { active: false, x: 0, y: 0, clientY: 0, isScroll: false };
const dayScrollByDateKey = new Map<string, number>();

export function DayView({
  date,
  reservations,
  error,
  onBack,
  onUpdatePosition,
  onSaveContent,
  onUpdateColor,
  onDelete,
  onPreviousDay,
  onNextDay,
}: DayViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<ReservationEditorHandle>(null);
  const editorPanelRef = useRef<HTMLDivElement>(null);
  const gridInteractiveAt = useRef(0);
  const blockBackdropUntilRef = useRef(0);
  const isDismissingRef = useRef(false);
  const dismissEditorRef = useRef<() => Promise<void>>(async () => {});
  const dateKey = toDateString(date);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [liveEditText, setLiveEditText] = useState("");
  const [pending, setPending] = useState<Reservation | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [repositioningId, setRepositioningId] = useState<string | null>(null);
  const [repositionOffsetY, setRepositionOffsetY] = useState(0);
  const dragOrigin = useRef({ clientY: 0, startMinutes: 0, duration: 0 });
  const dragLastClientY = useRef(0);
  const repositionOrigin = useRef({ clientY: 0, startMinutes: 0, duration: 0 });
  const repositionBaseOffsetY = useRef(0);
  const createOrigin = useRef({ clientY: 0, startMinutes: 0 });
  const isCreating = useRef(false);
  const pendingRef = useRef<Reservation | null>(null);
  const gridGesture = useRef({ ...EMPTY_GRID_GESTURE });
  const isRepositioning = useRef(false);
  const repositionDrag = useRafValue(setRepositionOffsetY);
  const blockDrag = useRafValue(setDragOffsetY);
  const editingIdRef = useRef<string | null>(null);

  const [positionPreview, setPositionPreview] = useState<{
    id: string;
    start_minutes: number;
    duration_minutes: number;
  } | null>(null);
  const [zoom, setZoom] = useState(() => {
    if (typeof window === "undefined") return 1;
    let parsed = Number.NaN;
    try {
      parsed = Number(window.localStorage.getItem(ZOOM_STORAGE_KEY));
    } catch {
      return 1;
    }
    if (!Number.isFinite(parsed)) return 1;
    return Math.min(DAY_VIEW_MAX_ZOOM, Math.max(DAY_VIEW_MIN_ZOOM, parsed));
  });
  const hourHeight = Math.round(HOUR_HEIGHT * zoom);
  const gridHeight = getGridHeight(hourHeight);
  const timelineOffsetY = getTimelineContentOffsetY(hourHeight);
  const pendingZoomAnchorMinutes = useRef<number | null>(null);
  const pinchState = useRef({
    active: false,
    startDistance: 0,
    startZoom: 1,
  });

  const displayReservations = useMemo(() => {
    const list =
      !pending || reservations.some((r) => r.id === pending.id)
        ? reservations
        : [...reservations, pending].sort(compareReservationsByTime);

    if (!positionPreview) return list;

    return list.map((reservation) =>
      reservation.id === positionPreview.id
        ? {
            ...reservation,
            start_minutes: positionPreview.start_minutes,
            duration_minutes: positionPreview.duration_minutes,
          }
        : reservation,
    );
  }, [reservations, pending, positionPreview]);

  const visibleReservations = useMemo(
    () =>
      displayReservations.filter((reservation) =>
        shouldShowOnDayTimeline(reservation, editingId),
      ),
    [displayReservations, editingId],
  );

  useEffect(() => {
    if (!positionPreview) return;

    const saved = reservations.find((r) => r.id === positionPreview.id);
    if (saved?.start_minutes === positionPreview.start_minutes) {
      setPositionPreview(null);
    }
  }, [reservations, positionPreview]);

  const blockLayouts = useMemo(
    () => layoutReservations(visibleReservations),
    [visibleReservations],
  );

  const editingReservation = useMemo(() => {
    if (!editingId) return null;
    if (pending?.id === editingId) return pending;
    return reservations.find((r) => r.id === editingId) ?? null;
  }, [editingId, pending, reservations]);

  const editorViewport = useVisualViewportLayout(Boolean(editingReservation));

  useEffect(() => {
    if (!editingId) {
      isDismissingRef.current = false;
    }
  }, [editingId]);

  useEffect(() => {
    editingIdRef.current = editingId;
  }, [editingId]);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    scroll.style.overflow = draggingId ? "hidden" : "";
    return () => {
      scroll.style.overflow = "";
    };
  }, [draggingId]);

  useEffect(() => {
    return () => {
      const scroll = scrollRef.current;
      if (!scroll) return;
      dayScrollByDateKey.set(dateKey, scroll.scrollTop);
    };
  }, [dateKey]);

  useEffect(() => {
    if (isCreating.current) return;

    const target =
      pending ?? reservations.find((reservation) => reservation.id === editingId);
    const scroll = scrollRef.current;
    if (!target || !scroll) return;

    const blockTop = minutesToY(target.start_minutes, hourHeight);
    const blockBottom = blockTop + durationToHeight(target.duration_minutes, hourHeight);
    const viewTop = scroll.scrollTop;
    const viewBottom = viewTop + scroll.clientHeight;

    if (blockTop < viewTop || blockBottom > viewBottom) {
      scroll.scrollTo({
        top: Math.max(0, blockTop - hourHeight),
        behavior: "smooth",
      });
    }
  }, [pending?.id, editingId, hourHeight, pending, reservations]);

  const getMinutesFromPointer = useCallback((clientY: number) => {
    const grid = gridRef.current;
    if (!grid) return 0;

    const rect = grid.getBoundingClientRect();
    const y = Math.max(0, Math.min(clientY - rect.top, gridHeight));
    return yToMinutes(y, hourHeight);
  }, [gridHeight, hourHeight]);

  const applyZoom = useCallback((nextZoom: number) => {
    const clamped = Math.min(DAY_VIEW_MAX_ZOOM, Math.max(DAY_VIEW_MIN_ZOOM, nextZoom));
    if (Math.abs(clamped - zoom) < 0.001) return;

    const scroll = scrollRef.current;
    if (scroll) {
      const centerY = scroll.scrollTop + scroll.clientHeight / 2;
      pendingZoomAnchorMinutes.current = yToMinutes(centerY, hourHeight);
    }

    setZoom(clamped);
  }, [hourHeight, zoom]);

  const touchDistance = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length < 2) return 0;
    const [a, b] = [event.touches[0], event.touches[1]];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const handlePinchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (draggingId || isCreating.current || isRepositioning.current) return;
    if (event.touches.length < 2) return;
    const distance = touchDistance(event);
    if (distance <= 0) return;
    pinchState.current.active = true;
    pinchState.current.startDistance = distance;
    pinchState.current.startZoom = zoom;
    gridGesture.current = { ...EMPTY_GRID_GESTURE };
  }, [draggingId, zoom]);

  const handlePinchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (draggingId || isCreating.current || isRepositioning.current) return;
    if (!pinchState.current.active || event.touches.length < 2) return;
    const distance = touchDistance(event);
    if (distance <= 0) return;
    event.preventDefault();
    const scale = distance / pinchState.current.startDistance;
    applyZoom(pinchState.current.startZoom * scale);
  }, [applyZoom, draggingId]);

  const handlePinchEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length >= 2) return;
    pinchState.current.active = false;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(ZOOM_STORAGE_KEY, zoom.toFixed(2));
    } catch {
      // Ignore storage errors in restrictive WebView modes.
    }
  }, [zoom]);

  useEffect(() => {
    const scroll = scrollRef.current;
    const anchorMinutes = pendingZoomAnchorMinutes.current;
    if (!scroll || anchorMinutes === null) return;
    pendingZoomAnchorMinutes.current = null;

    requestAnimationFrame(() => {
      const centeredTop = minutesToY(anchorMinutes, hourHeight) - scroll.clientHeight / 2;
      const maxTop = Math.max(0, gridHeight - scroll.clientHeight);
      scroll.scrollTop = Math.max(0, Math.min(centeredTop, maxTop));
    });
  }, [gridHeight, hourHeight]);

  const resetCreation = useCallback(() => {
    isCreating.current = false;
    const pendingId = pending?.id ?? null;
    pendingRef.current = null;
    setPending(null);
    if (pendingId) {
      setEditingId((current) => (current === pendingId ? null : current));
      setLiveEditText("");
    }
  }, [pending?.id]);

  const finalizePendingCreate = useCallback(
    async (event?: React.PointerEvent<HTMLDivElement>) => {
      if (!isCreating.current || !pendingRef.current) return;

      if (event?.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      isCreating.current = false;
      blockBackdropUntilRef.current = Date.now() + 400;
    },
    [],
  );

  const beginCreateAt = useCallback((clientY: number) => {
    const minutes = getMinutesFromPointer(clientY);
    isCreating.current = true;
    createOrigin.current = { clientY, startMinutes: minutes };

    const nextPending = createPendingReservation(dateKey, minutes, DEFAULT_DURATION);
    blockBackdropUntilRef.current = Date.now() + 400;
    pendingRef.current = nextPending;
    setPending(nextPending);
    setLiveEditText("");
    setEditingId(nextPending.id);
    return nextPending;
  }, [dateKey, getMinutesFromPointer]);

  const cancelGridGesture = useCallback(() => {
    gridGesture.current = { ...EMPTY_GRID_GESTURE };
  }, []);

  const commitTouchTapCreate = useCallback(
    (clientY: number) => {
      beginCreateAt(clientY);
      void finalizePendingCreate();
    },
    [beginCreateAt, finalizePendingCreate],
  );

  const clearRepositionOffset = useCallback(() => {
    repositionDrag.cancel();
    setRepositionOffsetY(0);
  }, [repositionDrag]);

  const resetInteractionState = useCallback(() => {
    clearRepositionOffset();
    isRepositioning.current = false;
    setRepositioningId(null);
    setPositionPreview(null);
  }, [clearRepositionOffset]);

  const getSnappedStartFromClientY = useCallback((clientY: number, duration: number) => {
    return clampMinutes(getMinutesFromPointer(clientY), duration);
  }, [getMinutesFromPointer]);

  const startRepositioning = useCallback(
    (clientY: number) => {
      if (!editingReservation) return;

      const duration = editingReservation.duration_minutes;
      const startMinutes = editingReservation.start_minutes;
      const targetMinutes = getSnappedStartFromClientY(clientY, duration);

      isRepositioning.current = true;
      setRepositioningId(editingId);
      repositionOrigin.current = { clientY, startMinutes, duration };
      repositionBaseOffsetY.current =
        minutesToY(targetMinutes, hourHeight) - minutesToY(startMinutes, hourHeight);
      repositionDrag.cancel();
      repositionDrag.schedule(repositionBaseOffsetY.current);
    },
    [editingId, editingReservation, getSnappedStartFromClientY, hourHeight, repositionDrag],
  );

  const updateRepositioning = useCallback(
    (clientY: number) => {
      if (!isRepositioning.current) return;
      repositionDrag.schedule(
        repositionBaseOffsetY.current + (clientY - repositionOrigin.current.clientY),
      );
    },
    [repositionDrag],
  );

  const finishRepositioning = useCallback(
    async (clientY: number) => {
      if (!isRepositioning.current) return;

      const duration = repositionOrigin.current.duration;
      const deltaY = clientY - repositionOrigin.current.clientY;
      const dragged = Math.abs(deltaY) > 4;
      const newStart = dragged
        ? clampMinutes(
            repositionOrigin.current.startMinutes + offsetYToSnappedMinutes(deltaY, hourHeight),
            duration,
          )
        : getSnappedStartFromClientY(clientY, duration);
      const moved = newStart !== repositionOrigin.current.startMinutes;

      isRepositioning.current = false;
      setRepositioningId(null);

      if (!editingId) {
        clearRepositionOffset();
        return;
      }

      if (pending?.id === editingId) {
        setPending((value) =>
          value ? { ...value, start_minutes: newStart } : value,
        );
        clearRepositionOffset();
        return;
      }

      if (moved) {
        setPositionPreview({
          id: editingId,
          start_minutes: newStart,
          duration_minutes: duration,
        });
      }

      clearRepositionOffset();

      if (!moved) return;

      try {
        await onUpdatePosition(editingId, newStart, duration);
      } catch {
        setPositionPreview((preview) => (preview?.id === editingId ? null : preview));
      }
    },
    [editingId, pending, clearRepositionOffset, onUpdatePosition, getSnappedStartFromClientY],
  );

  const handleGridPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (draggingId) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    gridGesture.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
      clientY: event.clientY,
      isScroll: false,
    };
  };

  const handleGridPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (gridGesture.current.active && !isCreating.current) {
      const dx = event.clientX - gridGesture.current.x;
      const dy = event.clientY - gridGesture.current.y;
      if (Math.hypot(dx, dy) > TAP_THRESHOLD) {
        if (event.pointerType === "mouse") {
          beginCreateAt(gridGesture.current.clientY);
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        gridGesture.current.isScroll = true;
      }
      return;
    }

    if (!isCreating.current || !pending) return;

    const end = getMinutesFromPointer(event.clientY);
    const start = createOrigin.current.startMinutes;
    const duration = Math.max(SNAP_MINUTES, Math.abs(end - start) || DEFAULT_DURATION);
    const clampedStart = clampMinutes(Math.min(start, end), duration);

    setPending((current) => {
      if (!current) return current;
      const next = {
        ...current,
        start_minutes: clampedStart,
        duration_minutes: duration,
      };
      pendingRef.current = next;
      return next;
    });
  };

  const handleGridPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (gridGesture.current.active) {
      if (!gridGesture.current.isScroll) {
        commitTouchTapCreate(event.clientY);
        event.stopPropagation();
      }
      cancelGridGesture();
      return;
    }

    if (isCreating.current) {
      event.stopPropagation();
    }
    void finalizePendingCreate(event);
  };

  const closeEditor = useCallback(() => {
    setEditingId(null);
    setLiveEditText("");
    pendingRef.current = null;
    setPending(null);
    resetInteractionState();
  }, [resetInteractionState]);

  const dismissEditor = useCallback(async () => {
    if (isDismissingRef.current) return;
    isDismissingRef.current = true;

    try {
      await editorRef.current?.dismiss();
    } catch {
      isDismissingRef.current = false;
      return;
    }

    closeEditor();
  }, [closeEditor]);

  dismissEditorRef.current = dismissEditor;

  const handleDismissRequest = useCallback(() => {
    if (Date.now() < blockBackdropUntilRef.current) return;
    if (isCreating.current) return;
    void dismissEditor();
  }, [dismissEditor]);

  const handleSelectReservation = (id: string) => {
    blockBackdropUntilRef.current = Date.now() + 400;
    resetCreation();
    setDraggingId(null);
    setDragOffsetY(0);
    resetInteractionState();
    const reservation = displayReservations.find((r) => r.id === id);
    setLiveEditText(reservation ? formatReservationDisplay(reservation) : "");
    setEditingId(id);
  };

  const handleDragStart = (id: string, clientY: number) => {
    const reservation = displayReservations.find((r) => r.id === id);
    if (!reservation || id === pending?.id) return;

    setDraggingId(id);
    dragOrigin.current = {
      clientY,
      startMinutes: reservation.start_minutes,
      duration: reservation.duration_minutes,
    };
    dragLastClientY.current = clientY;
    setDragOffsetY(0);
  };

  const handleDragMove = (clientY: number) => {
    if (!draggingId) return;
    dragLastClientY.current = clientY;
    blockDrag.schedule(clientY - dragOrigin.current.clientY);
  };

  const handleDragEnd = async (id: string) => {
    const offsetY = dragLastClientY.current - dragOrigin.current.clientY;
    const duration = dragOrigin.current.duration;
    const deltaMinutes = offsetYToSnappedMinutes(offsetY, hourHeight);
    const newStart = clampMinutes(dragOrigin.current.startMinutes + deltaMinutes, duration);

    blockDrag.cancel();

    const reservation = reservations.find((r) => r.id === id);
    const moved = Boolean(reservation && newStart !== reservation.start_minutes);

    if (moved) {
      setPositionPreview({
        id,
        start_minutes: newStart,
        duration_minutes: duration,
      });
    }

    setDraggingId(null);
    setDragOffsetY(0);

    if (!moved || !reservation) return;

    try {
      await onUpdatePosition(id, newStart, duration);
    } catch {
      setPositionPreview((preview) => (preview?.id === id ? null : preview));
    }
  };

  const handleDelete = async (id: string) => {
    if (pending?.id === id) {
      resetCreation();
      closeEditor();
      return;
    }
    await onDelete(id);
    closeEditor();
  };

  const handleColorChange = async (id: string, color: ReservationColor | null) => {
    if (pending?.id === id) {
      setPending((current) => (current ? { ...current, color } : current));
      return;
    }
    await onUpdateColor(id, color);
  };

  useEffect(() => {
    gridInteractiveAt.current = Date.now();
    setEditingId(null);
    setLiveEditText("");
    setPending(null);
    isCreating.current = false;
    setDraggingId(null);
    setDragOffsetY(0);
    repositionDrag.cancel();
    setRepositionOffsetY(0);
    isRepositioning.current = false;
    setRepositioningId(null);
    setPositionPreview(null);
    requestAnimationFrame(() => {
      const scroll = scrollRef.current;
      if (!scroll) return;
      const savedTop = dayScrollByDateKey.get(dateKey) ?? 0;
      const maxTop = Math.max(0, gridHeight - scroll.clientHeight);
      scroll.scrollTop = Math.min(savedTop, maxTop);
    });
  }, [dateKey, gridHeight, repositionDrag]);

  const isGridInteractive = () => Date.now() - gridInteractiveAt.current > GRID_WARMUP_MS;

  const dismissEditorIfOpen = useCallback(async () => {
    if (!editingIdRef.current) return true;
    try {
      await dismissEditorRef.current();
      return true;
    } catch {
      return false;
    }
  }, []);

  const navigateDay = useCallback(
    async (go: () => void) => {
      if (!(await dismissEditorIfOpen())) return;
      go();
    },
    [dismissEditorIfOpen],
  );

  const handleBack = useCallback(async () => {
    if (!(await dismissEditorIfOpen())) return;
    onBack();
  }, [dismissEditorIfOpen, onBack]);

  const daySwipe = useHorizontalSwipe({
    onSwipeLeft: () => navigateDay(onNextDay),
    onSwipeRight: () => navigateDay(onPreviousDay),
    shouldIgnore: () =>
      pinchState.current.active ||
      isRepositioning.current ||
      isCreating.current ||
      draggingId !== null ||
      editingIdRef.current !== null,
  });

  const handleRootPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (pinchState.current.active) return;
      if (editorPanelRef.current?.contains(event.target as Node)) return;
      daySwipe.onPointerDown(event);
    },
    [daySwipe],
  );

  const handleRootPointerUpCapture = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (pinchState.current.active) return;
      if (editorPanelRef.current?.contains(event.target as Node)) return;
      if (editingIdRef.current) return;
      void daySwipe.onPointerUp(event);
    },
    [daySwipe],
  );

  return (
    <div
      className="branch-surface flex h-dvh flex-col touch-pan-y"
      onPointerDown={handleRootPointerDown}
      onPointerUpCapture={handleRootPointerUpCapture}
      onPointerCancel={daySwipe.onPointerCancel}
      onTouchStart={handlePinchStart}
      onTouchMove={handlePinchMove}
      onTouchEnd={handlePinchEnd}
      onTouchCancel={() => {
        pinchState.current.active = false;
      }}
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-gcal-border px-3 pb-3 pt-screen-header">
        <button
          type="button"
          onClick={() => void handleBack()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gcal-text hover:bg-[#f1f3f4]"
          aria-label="달력으로 돌아가기"
        >
          <span className="text-3xl leading-none font-light">‹</span>
        </button>
        <h1 className="min-w-0 flex-1 truncate text-lg text-gcal-text">
          {formatSelectedDateTitle(date)}
        </h1>
        <span className="shrink-0 text-base font-medium text-gcal-text">
          {getStoreBrandLabel()}
        </span>
      </header>

      {error && (
        <p className="shrink-0 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto"
        onScroll={(event) => {
          dayScrollByDateKey.set(dateKey, event.currentTarget.scrollTop);
        }}
      >
        <div className="relative flex" style={{ minHeight: gridHeight }}>
          <div
            className="branch-surface sticky left-0 z-20 w-16 shrink-0 touch-pan-y"
            onPointerDown={(event) => {
              if (event.button !== 0 || draggingId || !isGridInteractive()) return;
              if (!editingId || liveEditText.trim()) return;

              startRepositioning(event.clientY);
              gridRef.current?.setPointerCapture(event.pointerId);
            }}
          >
            <div
              className="border-r border-gcal-border"
              style={{ height: TIMELINE_PADDING_ROWS * hourHeight }}
            />
            {Array.from({ length: TIMELINE_HOUR_COUNT }, (_, index) => (
              <div
                key={TIMELINE_START_HOUR + index}
                className="relative border-r border-gcal-border text-right text-xs text-gcal-gray"
                style={{ height: hourHeight }}
              >
                <span className="absolute -top-2 right-2">
                  {formatHourLabel(TIMELINE_START_HOUR + index)}
                </span>
              </div>
            ))}
            <div className="relative border-r border-gcal-border text-right text-xs text-gcal-gray">
              <span className="absolute -top-2 right-2">
                {formatHourLabel(TIMELINE_END_HOUR)}
              </span>
            </div>
            <div
              className="border-r border-gcal-border"
              style={{ height: TIMELINE_PADDING_ROWS * hourHeight }}
            />
          </div>

          <div
            ref={gridRef}
            className="relative flex-1 touch-pan-y select-none"
            style={{ height: gridHeight }}
            onPointerDown={(event) => {
              if (draggingId) return;
              if (pinchState.current.active) return;
              if (event.pointerType === "mouse" && event.button !== 0) return;
              if (!isGridInteractive()) return;
              if (event.target !== event.currentTarget) return;

              if (editingId && editingReservation && !liveEditText.trim()) {
                startRepositioning(event.clientY);
                event.currentTarget.setPointerCapture(event.pointerId);
                return;
              }

              if (editingId) return;

              handleGridPointerDown(event);
            }}
            onPointerMove={(event) => {
              if (isRepositioning.current && editingId) {
                updateRepositioning(event.clientY);
                return;
              }
              handleGridPointerMove(event);
            }}
            onPointerUp={(event) => {
              if (isRepositioning.current) {
                event.currentTarget.releasePointerCapture(event.pointerId);
                void finishRepositioning(event.clientY);
                return;
              }
              void handleGridPointerUp(event);
            }}
            onPointerCancel={() => {
              cancelGridGesture();
              if (isCreating.current) return;
              resetInteractionState();
              resetCreation();
            }}
          >
            {Array.from({ length: TIMELINE_HOUR_COUNT }, (_, hour) => (
              <div
                key={hour}
                className="pointer-events-none absolute right-0 left-0 border-t border-gcal-border"
                style={{
                  top: timelineOffsetY + hour * hourHeight,
                  height: hourHeight,
                }}
              />
            ))}
            <div
              className="pointer-events-none absolute right-0 left-0 border-t border-gcal-border"
              style={{
                top: timelineOffsetY + TIMELINE_HOUR_COUNT * hourHeight,
              }}
            />

            {visibleReservations.map((reservation) => {
              const layout = blockLayouts.get(reservation.id) ?? {
                column: 0,
                totalColumns: 1,
              };

              return (
                <ReservationBlock
                  key={reservation.id}
                  reservation={reservation}
                  layout={layout}
                  hourHeight={hourHeight}
                  isPending={pending?.id === reservation.id}
                  isEditing={editingId === reservation.id}
                  liveText={editingId === reservation.id ? liveEditText : undefined}
                  isDragging={draggingId === reservation.id}
                  isRepositioning={repositioningId === reservation.id}
                  dragOffsetY={draggingId === reservation.id ? dragOffsetY : 0}
                  repositionOffsetY={
                    repositioningId === reservation.id ? repositionOffsetY : 0
                  }
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={(id) => void handleDragEnd(id)}
                  onSelect={handleSelectReservation}
                />
              );
            })}
          </div>
        </div>
      </div>

      {editingReservation && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/25"
            aria-hidden
            onPointerDown={() => handleDismissRequest()}
          />
          <div
            ref={editorPanelRef}
            className="fixed inset-x-0 z-50 overflow-y-auto border-t border-gcal-border bg-white px-4 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.12)]"
            style={{
              bottom: editorViewport.bottomInset,
              maxHeight: Math.min(editorViewport.height * 0.85, 520),
            }}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
          >
            <div className="mx-auto w-full max-w-3xl">
              <ReservationEditor
                ref={editorRef}
                reservation={editingReservation}
                value={liveEditText}
                onChange={setLiveEditText}
                onSave={async (raw) => {
                  const saved = await onSaveContent(editingReservation, raw);
                  pendingRef.current = null;
                  setPending(null);
                  setEditingId(saved.id);
                }}
                onDelete={() => handleDelete(editingReservation.id)}
                onColorChange={(color) => handleColorChange(editingReservation.id, color)}
                onDismissRequest={handleDismissRequest}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
