import localFont from "next/font/local";

/**
 * Registers the Antinoou font family used for rendered Coptic text.
 */
export const antinoou = localFont({
  src: [
    {
      path: "../fonts/AntinoouFont-1.0.6/antinoou-webfont.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/AntinoouFont-1.0.6/antinoouitalic-webfont.woff",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-coptic",
  display: "swap",
  preload: false,
});
