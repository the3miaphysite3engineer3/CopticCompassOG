import { Manrope } from "next/font/google";
import localFont from "next/font/local";

/**
 * Registers Manrope as the primary Latin/UI brand typeface.
 */
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

/**
 * Registers the Antinoou font family used for rendered Coptic text.
 */
export const antinoou = localFont({
  src: [
    {
      path: "../fonts/AntinoouFont-1.0.6/antinoou-webfont.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/AntinoouFont-1.0.6/antinoouitalic-webfont.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-coptic",
  display: "swap",
  preload: false,
});

export const fontVariables = `${manrope.variable} ${antinoou.variable}`;
