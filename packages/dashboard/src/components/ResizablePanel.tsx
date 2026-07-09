import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface ResizablePanelProps {
  /** Which edge the drag handle sits on — the panel grows toward the opposite edge. */
  side: "left" | "right";
  /** localStorage key the chosen width persists under, so it survives a reload. */
  storageKey: string;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  className?: string;
  children: ReactNode;
}

export function ResizablePanel({
  side,
  storageKey,
  defaultWidth,
  minWidth,
  maxWidth,
  className,
  children,
}: ResizablePanelProps) {
  const [width, setWidth] = useState(() => {
    const stored = Number(localStorage.getItem(storageKey));
    return stored >= minWidth && stored <= maxWidth ? stored : defaultWidth;
  });
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragState.current) return;
      const delta = e.clientX - dragState.current.startX;
      // Dragging the right-edge handle (left panel) grows width to the right;
      // dragging the left-edge handle (right panel) grows width to the left.
      const signedDelta = side === "left" ? delta : -delta;
      const next = Math.min(maxWidth, Math.max(minWidth, dragState.current.startWidth + signedDelta));
      setWidth(next);
    },
    [side, minWidth, maxWidth],
  );

  const stopDragging = useCallback(() => {
    if (!dragState.current) return;
    dragState.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", stopDragging);
  }, [onPointerMove]);

  useEffect(() => {
    localStorage.setItem(storageKey, String(width));
  }, [storageKey, width]);

  function startDragging(e: React.PointerEvent) {
    dragState.current = { startX: e.clientX, startWidth: width };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDragging);
  }

  const handle = (
    <div
      onPointerDown={startDragging}
      className="group relative w-1 shrink-0 cursor-col-resize"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panel"
    >
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-hairline transition-colors group-hover:bg-series-1" />
    </div>
  );

  return (
    <div className={`flex shrink-0 ${className ?? ""}`} style={{ width }}>
      {side === "right" && handle}
      <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
      {side === "left" && handle}
    </div>
  );
}
