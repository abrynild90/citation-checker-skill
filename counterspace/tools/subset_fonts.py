"""Regenerate fonts/*.woff2 (Latin + the symbols the page uses; SIL OFL). Needs: pip install fonttools brotli, and in a scratch dir
npm i @fontsource-variable/newsreader @ibm/plex-sans @ibm/plex-mono   (usage: python3 tools/subset_fonts.py <node_modules dir>).
Plex comes from @ibm/* because the @fontsource latin subsets lack → ≤ ≥ ✓. Plex keeps its TrueType hinting (unhinted, Linux Chromium spaces glyphs
unevenly at 10-12 px). Newsreader (variable, opsz + wght) is limited to wght 400-600 and to ASCII plus typographic punctuation."""
import subprocess, sys, pathlib
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

NM = pathlib.Path(sys.argv[1])
OUT = pathlib.Path(__file__).resolve().parent.parent / 'fonts'
U = lambda xs: ','.join('U+%04X' % u for u in xs)
PUNCT = [0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026, 0x2212, 0x2264, 0x2265]
PLEX = list(range(0x20, 0x7f)) + list(range(0xa0, 0x100)) + PUNCT + [0x131, 0x152, 0x153, 0x2009, 0x2022, 0x2190, 0x2192, 0x2248, 0x2713]
NEWS = list(range(0x20, 0x7f)) + [0xa0, 0xb0, 0xb7, 0xd7, 0xe9, 0xe8, 0xfc, 0xf6, 0xe4, 0xf1, 0xe7] + PUNCT
PF = 'kern,liga,calt,ccmp,locl,mark,mkmk,tnum,lnum,pnum,case,zero,frac,numr,dnom,sups'


def sub(src, out, uni, feats, extra=()):
    subprocess.check_call(['pyftsubset', str(src), '--unicodes=' + U(uni), '--flavor=woff2', '--layout-features=' + feats, *extra,
                           '--output-file=' + str(OUT / out)])


for name, f in (('Newsreader-opsz.woff2', 'normal'), ('Newsreader-opsz-italic.woff2', 'italic')):
    src = NM / f'@fontsource-variable/newsreader/files/newsreader-latin-opsz-{f}.woff2'
    font = instancer.instantiateVariableFont(TTFont(src), {'wght': (400, 600)})
    font.flavor = None
    font.save('/tmp/_nr.ttf')
    sub('/tmp/_nr.ttf', name, NEWS, 'kern,liga,calt,ccmp,locl,mark,mkmk,lnum,pnum,case', ['--no-hinting', '--desubroutinize'])
P = NM / '@ibm/plex-sans/fonts/complete/woff2'
for w, n in ((400, 'Regular'), (500, 'Medium'), (600, 'SemiBold')):
    sub(P / f'IBMPlexSans-{n}.woff2', f'IBMPlexSans-{w}.woff2', PLEX, PF)
sub(P / 'IBMPlexSans-Italic.woff2', 'IBMPlexSans-400-italic.woff2', PLEX, PF)
sub(NM / '@ibm/plex-mono/fonts/complete/woff2/IBMPlexMono-Regular.woff2', 'IBMPlexMono-400.woff2', PLEX, PF)
