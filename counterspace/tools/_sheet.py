import sys,glob
from PIL import Image
pat,out,cols,cw=sys.argv[1],sys.argv[2],int(sys.argv[3]),int(sys.argv[4])
fs=sorted(glob.glob(pat)); ims=[Image.open(f).convert('RGB') for f in fs]
ims=[i.resize((cw,int(i.height*cw/i.width))) for i in ims]
rh=max(i.height for i in ims); rows=(len(ims)+cols-1)//cols
S=Image.new('RGB',(cols*cw,rows*rh),(0,0,0))
for k,i in enumerate(ims): S.paste(i,((k%cols)*cw,(k//cols)*rh))
S.save(out); print(fs)
