"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const sessionKey = `visit-tracked:${pathname}`;

    try {
      if (window.sessionStorage.getItem(sessionKey)) {
        return;
      }

      window.sessionStorage.setItem(sessionKey, "1");
    } catch {
      return;
    }

    fetch("/api/track-visit", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
