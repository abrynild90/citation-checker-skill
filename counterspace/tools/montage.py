"""Tile screenshots into one contact sheet so many can be reviewed at once.
Usage: python3 tools/montage.py OUT.png COLS CELL_WIDTH file1.png file2.png ...
Each cell is scaled to CELL_WIDTH and captioned with its file name (without folder and extension)."""
import sys
from PIL import Image, ImageDraw, ImageFont


def main():
    out, cols, cell_w, files = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4:]
    imgs = []
    for f in files:
        im = Image.open(f).convert('RGB')
        h = round(im.height * cell_w / im.width)
        imgs.append((f, im.resize((cell_w, h), Image.LANCZOS)))
    rows = [imgs[i:i + cols] for i in range(0, len(imgs), cols)]
    cap_h, pad = 22, 8
    row_h = [max(i.height for _, i in r) + cap_h for r in rows]
    sheet = Image.new('RGB', (cols * (cell_w + pad) + pad, sum(row_h) + pad * (len(rows) + 1)), (24, 24, 28))
    d = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
    except OSError:
        font = ImageFont.load_default()
    y = pad
    for r, rh in zip(rows, row_h):
        for c, (f, im) in enumerate(r):
            x = pad + c * (cell_w + pad)
            d.text((x, y + 3), f.rsplit('/', 1)[-1].rsplit('.', 1)[0], fill=(230, 230, 235), font=font)
            sheet.paste(im, (x, y + cap_h))
        y += rh + pad
    sheet.save(out)
    print(out, sheet.size)


main()
