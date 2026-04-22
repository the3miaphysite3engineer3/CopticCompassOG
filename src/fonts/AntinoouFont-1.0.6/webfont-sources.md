# Antinoou Webfont Sources

This directory vendors published Antinoou WOFF files for browser and Open Graph
image rendering. The former local TrueType copies are no longer used by this
project.

The original Antinoou font is hosted by Evertype:

- `https://evertype.com/fonts/coptic/`
- Evertype lists Antinoou 1.0.6, dated 2012-09-12, with roman and italic
  TrueType downloads.

The WOFF files were downloaded on 2026-04-22 from Coptic Scriptorium:

- `antinoou-webfont.woff`
  - Source: `https://copticscriptorium.org/antinoou-webfont.woff`
  - SHA-256: `514ed45a08300db7d605c61e28c2f6e6d40a5aec425247f9951158ba038180b6`
- `antinoouitalic-webfont.woff`
  - Source: `https://copticscriptorium.org/antinoouitalic-webfont.woff`
  - SHA-256: `f6c063ec0f707f8a7f8f7781240a9e8116b5f31e29621026b5e303e40d827580`

Coptic Dictionary Online and Coptic Scriptorium both reference Antinoou WOFF
webfont files in their public CSS. This project does not convert, subset, or
otherwise alter Antinoou locally. The local `Antinoou.ttf`,
`AntinoouItalic.ttf`, and `antinoou-licence.txt` files were removed when the
project switched to WOFF-only runtime delivery; consult the Evertype page above
for the upstream font and current terms.
