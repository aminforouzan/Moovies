import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { getHeaderSlot, subscribeToHeaderSlot } from "@/lib/headerSlot";

/**
 * Renders route-owned controls inside the app header.
 */
export function HeaderSlot({ children }: { children: React.ReactNode }) {
  const target = useSyncExternalStore(
    subscribeToHeaderSlot,
    getHeaderSlot,
    () => null,
  );

  if (!target) return null;
  return createPortal(children, target);
}
