"use client";

import { useEffect } from "react";
import { reportClientError } from "@/components/error-reporter";

/** Logs a 404 with the address the visitor tried and where they came from. */
export function NotFoundReporter() {
  useEffect(() => {
    reportClientError("not_found", `Page not found: ${window.location.pathname}`);
  }, []);
  return null;
}
