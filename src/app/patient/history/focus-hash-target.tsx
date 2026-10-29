"use client";

import { useEffect } from "react";

/** Client navigation scrolls to a hash but does not move focus; do it once. */
export function FocusHashTarget({ id }: { id: string }) {
  useEffect(() => {
    if (window.location.hash !== `#${id}`) return;
    document.getElementById(id)?.focus({ preventScroll: true });
  }, [id]);
  return null;
}
