# Antinoou Webfont Sources

This directory keeps Antinoou webfonts for Coptic rendering:

- `antinoou-webfont.woff2` and `antinoouitalic-webfont.woff2` are used by the
  browser through `next/font`.
- `antinoou-webfont.woff` is kept for Open Graph image rendering because
  Next.js `ImageResponse` supports WOFF but rejects WOFF2 font data.

The original Antinoou font is hosted by Evertype:

- `https://evertype.com/fonts/coptic/`

The local WOFF2 files were converted from the public Antinoou WOFF webfonts
used by Coptic Scriptorium and Coptic Dictionary Online:

- Coptic Scriptorium:
  `https://copticscriptorium.org/antinoou-webfont.woff`
- Coptic Scriptorium italic:
  `https://copticscriptorium.org/antinoouitalic-webfont.woff`
- Coptic Dictionary Online font directory:
  `https://copt-ot.adw-goe.de/community/fonts/`

Consult Evertype for the upstream font and current terms.
