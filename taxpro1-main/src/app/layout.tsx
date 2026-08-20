import type { Metadata } from "next";
import { Montserrat, Poppins } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartProvider } from "@/components/cart-provider";
// TEMP: disabled per request. Uncomment to restore the chat widget.
// import { AIChat } from "@/components/ai-chat";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Taxpropath — Accounting & Tax Webinars",
    template: "%s | Taxpropath",
  },
  description:
    "5000+ hours of approved CPE courses for Accounting, Tax, Finance, and HR professionals. Unlimited learning with an annual subscription for just $199.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${poppins.variable} font-sans antialiased`}>
        <CartProvider>
          <div className="flex min-h-dvh flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
          {/* TEMP: disabled per request. Restore by uncommenting the import above and this line. */}
          {/* <AIChat /> */}
        </CartProvider>
      </body>
    </html>
  );
}
