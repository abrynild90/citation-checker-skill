"""How fonts/*.woff2 were made (SIL OFL). Run once, in a scratch folder, when a face changes:
    npm i @fontsource-variable/newsreader @ibm/plex-sans        pip install fonttools brotli
    python3 tools/subset_fonts.py <that folder's node_modules>
Newsreader (Production Type) is copied unchanged from @fontsource-variable: the complete Latin and Latin Extended variable fonts (weight 200-800,
optical size 6-72), roman and italic. IBM Plex Sans comes from @ibm/plex-sans (the fontsource Latin subsets lack arrows and maths signs): the
hinted Regular, SemiBold and Bold faces trimmed to Latin, Latin-1, Latin Extended-A, general punctuation, arrows and the marks the page uses.
Plex keeps its TrueType hinting (unhinted, Linux Chromium spaces its glyphs unevenly at small sizes). The page uses weights 400, 600 and 700."""
import pathlib, shutil, subprocess, sys

if len(sys.argv) != 2:
    sys.exit('usage: python3 tools/subset_fonts.py <node_modules dir>')
NM = pathlib.Path(sys.argv[1])
OUT = pathlib.Path(__file__).resolve().parent.parent / 'fonts'
for src, dst in (('newsreader-latin-opsz-normal', 'Newsreader-latin.woff2'), ('newsreader-latin-ext-opsz-normal', 'Newsreader-latin-ext.woff2'),
                 ('newsreader-latin-opsz-italic', 'Newsreader-italic-latin.woff2')):
    shutil.copy(NM / '@fontsource-variable/newsreader/files' / f'{src}.woff2', OUT / dst)
U = (list(range(0x20, 0x7f)) + list(range(0xa0, 0x180)) + [0x192, 0x2c6, 0x2da, 0x2dc] + list(range(0x2000, 0x2070)) + [0x20ac, 0x2122]
     + list(range(0x2190, 0x219a)) + [0x2212, 0x2215, 0x2248, 0x2260, 0x2264, 0x2265, 0x2713, 0x25cf, 0x25cb, 0x2022])
FEATURES = 'kern,liga,calt,ccmp,locl,mark,mkmk,tnum,lnum,pnum,case,zero,frac,numr,dnom,sups'
for name, weight in (('Regular', 400), ('SemiBold', 600), ('Bold', 700)):
    subprocess.check_call(['pyftsubset', str(NM / f'@ibm/plex-sans/fonts/complete/woff2/IBMPlexSans-{name}.woff2'),
                           '--unicodes=' + ','.join('U+%04X' % u for u in U), '--flavor=woff2', '--layout-features=' + FEATURES,
                           '--output-file=' + str(OUT / f'IBMPlexSans-{weight}.woff2')])
