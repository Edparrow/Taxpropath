import type { Metadata } from "next";
import { Montserrat, Poppins } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SiteFrame } from "@/components/site-frame";
import { CartProvider } from "@/components/cart-provider";
import { ErrorReporter } from "@/components/error-reporter";
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

const SITE_URL = "https://taxpropath.com";
const SITE_TITLE = "Taxpropath — Accounting & Tax CPE Courses";
const SITE_DESCRIPTION =
  "5000+ hours of approved CPE courses for Accounting, Tax, Finance, and HR professionals. Unlimited learning with an annual subscription for just $199.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Taxpropath",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "Taxpropath",
    type: "website",
    images: [
      {
        url: "/herosection/slider_1__.webp",
        width: 1672,
        height: 941,
        alt: "Taxpropath — Accounting & Tax CPE Courses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/herosection/slider_1__.webp"],
  },
};

import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${montserrat.variable} ${poppins.variable} font-sans antialiased`}>
        <ErrorReporter />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <CartProvider>
            <SiteFrame header={<SiteHeader />} footer={<SiteFooter />}>
              {children}
            </SiteFrame>
            {/* TEMP: disabled per request. Restore by uncommenting the import above and this line. */}
            {/* <AIChat /> */}
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
