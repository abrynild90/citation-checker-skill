import sys,glob,os
from PIL import Image, ImageDraw
d, pat, cols, w = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
fs = sorted(glob.glob(os.path.join(d, pat)))
ims = [Image.open(f).convert('RGB') for f in fs]
if not ims: sys.exit('none')
h = int(ims[0].height * w / ims[0].width)
rows = (len(ims)+cols-1)//cols
S = Image.new('RGB', (cols*w, rows*(h+14)), (20,20,20)); g = ImageDraw.Draw(S)
for i,(f,im) in enumerate(zip(fs,ims)):
    x,y = (i%cols)*w, (i//cols)*(h+14); S.paste(im.resize((w,h)), (x,y+14)); g.text((x+3,y+1), os.path.basename(f)[:-4], fill=(255,255,0))
o = sys.argv[5]; S.save(o); print(o, S.size)
