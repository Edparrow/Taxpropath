"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Wraps public pages in the site header and footer. The admin panel
 * (/admin, /admin-login) is a separate app with its own chrome, so it gets
 * neither.
 */
export function SiteFrame({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/admin")) return <>{children}</>;

  return (
    <div className="site-content flex min-h-dvh flex-col">
      {header}
      <main className="flex-1">{children}</main>
      {footer}
    </div>
  );
}
