import { Noto_Sans } from "next/font/google";

/**
 * Applicant dashboard serif (Newsreader). Defined here, not in the layout, so
 * layers that render outside the layout's wrapper (the More sheet and the
 * phone date sheet are portalled to <body>) can add `newsreader.variable`
 * too — otherwise `.ap-serif` headings in them fall back to the sans font.
 * See app/applicant/layout.tsx for why this dashboard uses Newsreader.
 */
export const newsreader = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});
