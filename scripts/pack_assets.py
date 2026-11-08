from PIL import Image, ImageDraw
from pathlib import Path
p=Path(__file__).resolve().parents[1]/"assets"/"recipes"
ids=['bear','flower','star','berry','cocoa','petal']
canvas=Image.new('RGB',(1200,660),'#f5f6f1');draw=ImageDraw.Draw(canvas)
for i,k in enumerate(ids):
 im=Image.open(p/(k+'.png')).convert('RGB')
 im.save(p/(k+'.webp'),quality=88,method=6)
 thumb=im.resize((400,300),Image.Resampling.LANCZOS)
 x=(i%3)*400;y=(i//3)*330;canvas.paste(thumb,(x,y));draw.text((x+16,y+304),k,fill='#314535')
 print(k,(p/(k+'.webp')).stat().st_size)
canvas.save(p/'contact-sheet.jpg',quality=92)
