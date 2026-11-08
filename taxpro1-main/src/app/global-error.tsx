"use client";

import "./globals.css";
import { ErrorScreen } from "@/components/error-screen";

/** Last resort: the root layout itself crashed, so this renders its own <html>. */
export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ErrorScreen {...props} />
      </body>
    </html>
  );
}
