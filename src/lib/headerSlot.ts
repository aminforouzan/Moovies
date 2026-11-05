export const HEADER_SLOT_ID = "header-subnav";

let slot: HTMLElement | null = null;
const listeners = new Set<() => void>();

export function setHeaderSlot(element: HTMLElement | null) {
  slot = element;
  listeners.forEach((notify) => {
    notify();
  });
}

export function subscribeToHeaderSlot(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

export function getHeaderSlot() {
  return slot;
}
