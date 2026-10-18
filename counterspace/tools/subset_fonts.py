"""How fonts/*.woff2 were made (both families are SIL OFL 1.1; the licence texts sit beside the files). Run once, in a scratch folder, when a face changes:
    pip install fonttools brotli
    npm i @fontsource-variable/libre-bodoni@5.3.0                      # Libre Bodoni (Libre Bodoni Project Authors), headings only
    mkdir src && cd src
    curl -LO "https://cdn.jsdelivr.net/gh/uswds/public-sans@v2.001/fonts/variable/PublicSans%5Bwght%5D.ttf"          # Public Sans 2.001 (USWDS)
    curl -LO "https://cdn.jsdelivr.net/gh/uswds/public-sans@v2.001/fonts/variable/PublicSans-Italic%5Bwght%5D.ttf"
    python3 tools/subset_fonts.py <that folder's node_modules> <the src folder holding the two Public Sans TTFs>

Public Sans is the page's voice: body, interface, tables, buttons, tags, chart, SVG and 3D-label text. Both faces are variable (weight 100-900), so the
page's 400, 500, 600 and 700 are real drawings, never synthesized bold. The npm Public Sans packages and fontsource's "latin" cut leave out the maths signs
the page uses (U+2264 less-or-equal, U+2265 greater-or-equal, plus U+2248), which is why the upstream TTFs are the source: they are trimmed here to
Basic Latin, Latin-1, Latin Extended-A, general punctuation (quotes, dashes, ellipsis, spaces), the euro and trademark signs, the minus, the
maths signs and the bullet, with the OpenType features the page can use (kern, liga, calt, ccmp, locl, mark, mkmk, tnum, lnum, onum, pnum, frac,
numr, dnom, sups, subs). Public Sans has no arrow glyphs at all: the page draws its arrows as icons from the sprite, and the one text arrow left (the
"event to law" separator in the lag chart) falls back to the system sans, which every platform has. The italic is used for titles of books and reports.

Libre Bodoni is a high-contrast Didone: its hairlines vanish at small sizes, so it is used only for display headings (h1, h2, large numerals; never
under 28 px). Only the roman is shipped, trimmed to the same Basic Latin / Latin-1 / punctuation set (the page has no Latin Extended text; Public Sans
carries Latin Extended-A for anything that arrives later). Both were checked against every non-ASCII character in index.html."""
import pathlib, subprocess, sys

if len(sys.argv) != 3:
    sys.exit('usage: python3 tools/subset_fonts.py <node_modules dir> <folder with PublicSans[wght].ttf and PublicSans-Italic[wght].ttf>')
NM, SRC = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
OUT = pathlib.Path(__file__).resolve().parent.parent / 'fonts'
U = (list(range(0x20, 0x7f)) + list(range(0xa0, 0x180)) + [0x192, 0x2c6, 0x2da, 0x2dc] + list(range(0x2000, 0x2070)) + [0x20ac, 0x2122]
     + [0x2212, 0x2215, 0x2248, 0x2260, 0x2264, 0x2265, 0x2022, 0x2030])
FEATURES = 'kern,liga,calt,ccmp,locl,mark,mkmk,tnum,lnum,onum,pnum,frac,numr,dnom,sups,subs'


def subset(src, dst, unicodes=U, features=FEATURES):
    subprocess.check_call(['pyftsubset', str(src), '--unicodes=' + ','.join('U+%04X' % u for u in unicodes), '--flavor=woff2',
                           '--layout-features=' + features, '--output-file=' + str(OUT / dst)])


subset(SRC / 'PublicSans[wght].ttf', 'PublicSans-latin.woff2')
subset(SRC / 'PublicSans-Italic[wght].ttf', 'PublicSans-italic-latin.woff2')
subset(NM / '@fontsource-variable/libre-bodoni/files/libre-bodoni-latin-wght-normal.woff2', 'LibreBodoni-latin.woff2',
       U, 'kern,liga,ccmp,locl,mark,mkmk,lnum,onum,pnum,tnum')
