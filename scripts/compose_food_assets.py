"""Compose the transparent studio renders on soft neutral surfaces and encode WebP."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter,ImageChops
import json,sys,math
jobs=json.load(open(sys.argv[1]));out=Path(sys.argv[2])
for job in jobs:
    cover=job['cover'];name=job['name'];layers=sorted(job['layers'],key=lambda l:(l['z'],l['depth']))
    l=min(p['x']for p in layers);rr=max(p['x']+p['w']for p in layers);t=min(p['y']for p in layers);b=max(p['y']+p['h']for p in layers)
    width,height=(900,610) if cover else (400,300)
    scale=min(width*(.80 if cover else .73)/(rr-l),height*(.74 if cover else .75)/(b-t))
    offsetx=width*.5-(l+rr)*scale*.5;offsety=height*.485-(t+b)*scale*.5
    colors={'pizza':(242,233,216),'cookie':(240,229,211),'cake':(245,236,222)}
    bg=Image.new('RGB',(width,height)); pix=bg.load();rgb=colors.get(name,(248,244,236))
    for y in range(height):
        yy=y/height
        for x in range(width):
            delta=(1-yy)*3+(1-x/width)*2
            pix[x,y]=tuple(min(255,round(c+delta))for c in rgb)
    canvas=bg.convert('RGBA');ground=Image.new('RGBA',canvas.size)
    draw=ImageDraw.Draw(ground);cx=(l+rr)*.5*scale+offsetx;groundy=b*scale+offsety
    spread=(rr-l)*scale*.44;depth=max(8,(b-t)*scale*.12)
    draw.ellipse((cx-spread,groundy-depth*2,cx+spread,groundy+depth*.24),fill=(81,62,38,70))
    canvas.alpha_composite(ground.filter(ImageFilter.GaussianBlur(max(4,width*.017))))
    if name=='cake':
        # Neutral ceramic cake stand beneath the actual template assembly.
        pedestal=Image.new('RGBA',canvas.size);g=ImageDraw.Draw(pedestal)
        rx=width*.38;ry=height*.24;cy=groundy-ry*.77
        g.ellipse((cx-rx*.29,cy+ry*.30,cx+rx*.29,cy+ry*1.14),fill=(211,205,188,255))
        g.ellipse((cx-rx,cy-ry*.80+9,cx+rx,cy+ry*.80+9),fill=(206,205,190,255))
        g.ellipse((cx-rx,cy-ry*.80,cx+rx,cy+ry*.80),fill=(249,247,234,255),outline=(224,221,204,255),width=2)
        canvas.alpha_composite(pedestal)
    for i,p in enumerate(layers):
        piece=Image.frombytes('RGBA',(p['w'],p['h']),Path(p['file']).read_bytes())
        piece=piece.resize((max(1,round(piece.width*scale)),max(1,round(piece.height*scale))),Image.Resampling.LANCZOS)
        x=round(p['x']*scale+offsetx);y=round(p['y']*scale+offsety)
        if cover and i:
            shadow=Image.new('RGBA',canvas.size)
            dark=Image.new('RGBA',piece.size,(78,48,25,0));dark.putalpha(piece.getchannel('A').point(lambda a:round(a*.23)))
            shadow.alpha_composite(dark,(x+2,y+5));canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(3)))
        canvas.alpha_composite(piece,(x,y))
    final_size=(680,460) if cover else (240,180)
    canvas.convert('RGB').resize(final_size,Image.Resampling.LANCZOS).save(out/(name+'.webp'),quality=91,method=5)
