"use client";

import { useSyncExternalStore } from "react";
import type { StoreApi, UseBoundStore } from "zustand";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * This hook fixes hydration issues when using persist middleware with localStorage
 */
export const useStore = <T, F>(
  store: UseBoundStore<StoreApi<T>>,
  callback: (state: T) => F
) => {
  const result = store(callback);
  // Persisted browser preferences become visible only after hydration. Reading
  // the store directly then avoids mirroring every update into React state.
  const hydrated = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  return hydrated ? result : undefined;
};
