"use client";

import { useState, useCallback } from "react";

/**
 * Custom hook to manage a simple boolean state (e.g. toggle dropdowns, modals, nav drawers).
 *
 * @param initialValue - Initial state value (default: false)
 * @returns The boolean state and updater handlers (setTrue, setFalse, toggle, setValue)
 */
export function useBoolean(initialValue: boolean = false) {
  const [value, setValue] = useState(initialValue);

  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  const toggle = useCallback(() => setValue((prev) => !prev), []);

  return { value, setTrue, setFalse, toggle, setValue };
}
export type UseBooleanReturn = ReturnType<typeof useBoolean>;
