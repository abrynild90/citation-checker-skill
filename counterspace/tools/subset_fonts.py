"""Regenerate fonts/*.woff2 (Latin + the symbols the page uses; SIL OFL). Needs: pip install fonttools brotli, and in a scratch dir
npm i @fontsource-variable/newsreader @ibm/plex-sans   (usage: python3 tools/subset_fonts.py <node_modules dir>).
Plex comes from @ibm/* because the @fontsource latin subsets lack → ≤ ≥ ✓. Plex keeps its TrueType hinting (unhinted, Linux Chromium spaces glyphs
unevenly at 10-12 px). Newsreader roman (variable) is limited to wght 400-600 and opsz 17-46 (the serif sizes the page uses: 17 px captions to
the 46 px h1) and to ASCII plus typographic punctuation. Newsreader italic is only a few italic words in 17 px captions, so it is a static
instance (wght 400, opsz 17) of ASCII plus punctuation. Plex Sans has no 500 face: the only 500 text (.btn) is set at 600."""
import json, subprocess, sys, pathlib, tempfile
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

if len(sys.argv) != 2:
    sys.exit('usage: python3 tools/subset_fonts.py <node_modules dir>')
NM = pathlib.Path(sys.argv[1])
TMP = pathlib.Path(tempfile.mkdtemp()) / '_nr.ttf'
OUT = pathlib.Path(__file__).resolve().parent.parent / 'fonts'
U = lambda xs: ','.join('U+%04X' % u for u in xs)
PUNCT = [0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026, 0x2212, 0x2264, 0x2265]
PLEX = list(range(0x20, 0x7f)) + list(range(0xa0, 0x100)) + PUNCT + [0x131, 0x152, 0x153, 0x2009, 0x2022, 0x2190, 0x2192, 0x2248, 0x2713]
CH = json.loads((OUT / 'newsreader-chars.json').read_text())
NEWS = sorted({0x20, 0xa0, *CH['roman']})
PF = 'kern,liga,calt,ccmp,locl,mark,mkmk,tnum,lnum,pnum,case,zero,frac,numr,dnom,sups'


def sub(src, out, uni, feats, extra=()):
    subprocess.check_call(['pyftsubset', str(src), '--unicodes=' + U(uni), '--flavor=woff2', '--layout-features=' + feats, *extra,
                           '--output-file=' + str(OUT / out)])


NF = 'kern,liga,calt,ccmp,locl,mark,mkmk,lnum,pnum,case'
ITAL = sorted({0x20, *CH['italic']})
for name, f, axes, uni in (('Newsreader-opsz.woff2', 'normal', {'wght': (400, 600), 'opsz': (17, 46)}, NEWS),
                           ('Newsreader-italic-400.woff2', 'italic', {'wght': 400, 'opsz': 17}, ITAL)):
    src = NM / f'@fontsource-variable/newsreader/files/newsreader-latin-opsz-{f}.woff2'
    font = instancer.instantiateVariableFont(TTFont(src), axes)
    font.flavor = None
    font.save(TMP)
    sub(str(TMP), name, uni, NF, ['--no-hinting', '--desubroutinize'])
P = NM / '@ibm/plex-sans/fonts/complete/woff2'
for w, n in ((400, 'Regular'), (600, 'SemiBold')):
    sub(P / f'IBMPlexSans-{n}.woff2', f'IBMPlexSans-{w}.woff2', PLEX, PF)
