"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

// widget.js mounts its UI on <html> under this id.
const WIDGET_HOST_ID = "agy-chatbot-host";

/**
 * AskIntel chatbot widget, shown on public pages only.
 *
 * On /admin the scripts are never loaded. If the widget was already loaded on a
 * public page and the user navigates client-side into /admin, its host element
 * is hidden instead (and shown again on the way back out).
 */
export function ChatbotWidget() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    const host = document.getElementById(WIDGET_HOST_ID);
    if (host) host.style.display = isAdmin ? "none" : "";
  }, [isAdmin]);

  if (isAdmin) return null;

  return (
    <>
      {/* Config must be set before widget.js runs. */}
      <Script id="askintel-chatbot-config" strategy="afterInteractive">
        {`window.CHATBOT_ID = "f118eceb-d95e-4db0-b6e4-a2f34cd02704";
window.CHATBOT_SERVER = "https://askintel.in";`}
      </Script>
      <Script src="https://askintel.in/widget.js" strategy="lazyOnload" />
    </>
  );
}
