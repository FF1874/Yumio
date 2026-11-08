"""Bake deterministic food surface textures used by both the studio and its shelf renders."""
from pathlib import Path
import math
import numpy as np
from PIL import Image
OUT=Path(__file__).resolve().parents[1]/'assets/templates/materials'
OUT.mkdir(parents=True,exist_ok=True)
SIZE=256
y,x=np.mgrid[0:SIZE,0:SIZE]*2/(SIZE-1)-1
r=np.hypot(x,y);a=np.arctan2(y,x)
rng=np.random.default_rng(325840)
def noise(cells):
    arr=rng.integers(0,256,(cells,cells),dtype=np.uint8)
    return np.asarray(Image.fromarray(arr).resize((SIZE,SIZE),Image.Resampling.BICUBIC),float)/127.5-1
cloud=noise(7);mid=noise(25);grit=noise(80);fine=noise(256)
def solid(rgb):return np.broadcast_to(np.float64(rgb),(SIZE,SIZE,3)).copy()
def mix(im,rgb,mask):
    t=np.clip(mask,0,1)[...,None];return im*(1-t)+np.asarray(rgb)*t
def smooth(lo,hi,x):
    t=np.clip((x-lo)/(hi-lo),0,1);return t*t*(3-2*t)
def tint(im,k):return im+k[...,None]
def ellipse(cx,cy,rx,ry,angle=0):
    dx=x-cx;dy=y-cy;co=math.cos(angle);si=math.sin(angle);return np.hypot((dx*co+dy*si)/rx,(dy*co-dx*si)/ry)
def flecks(im,count,tones,maxsize,spread=.98):
    for i in range(count):
        cx,cy=rng.uniform(-spread,spread,2);rad=rng.uniform(maxsize*.20,maxsize)
        e=ellipse(cx,cy,rad,rng.uniform(.48,.85)*rad,rng.uniform(-3,3))
        im=mix(im,tones[i%len(tones)],np.exp(-e**2*2.7)*rng.uniform(.20,.78))
    return im
def save(key,im,side=False):
    rgb=Image.fromarray(np.clip(im,0,255).astype('uint8'))
    rgb.save(OUT/(key+('-side' if side else '')+'.webp'),quality=92,method=6)
def pizza():
    rim=smooth(.74,.86,r+mid*.024+cloud*.014)
    im=tint(solid([234,188,93]),cloud*19+mid*12+fine*3)
    lava=cloud*.75+mid*.32+.24*np.sin(x*11+y*4+cloud*4)
    im=mix(im,[183,62,33],(1-smooth(-.32,.07,lava))*.90)
    im=mix(im,[254,224,143],smooth(.20,.65,lava)*.82)
    im=mix(im,tint(solid([221,161,82]),mid*19+grit*9),rim)
    for i in range(38):
        theta=rng.uniform(0,2*np.pi);rr=rng.uniform(.81,.93);my=rng.uniform(.018,.095)
        e=ellipse(rr*math.cos(theta),rr*math.sin(theta),my,my*.46,theta+math.pi/2)
        im=mix(im,[112,61,33],np.exp(-e**2*1.6)*.75)
        im=mix(im,[63,42,29],np.exp(-e**2*4.4)*.65)
    save('base-pizza',flecks(im,260,[[121,70,37],[250,205,123]],.023))
    save('base-pizza',tint(solid([204,145,75]),cloud*25+grit*11+fine*5-(y+1)*14),True)
def cookie():
    im=tint(solid([218,167,103]),cloud*24+mid*12+grit*8+fine*4)
    im=mix(im,[164,103,47],smooth(.68,.99,r+.09*cloud)*.6)
    # Hairline cracks follow nearest-cell boundaries, interrupted by the crumb.
    pts=rng.uniform(-1.3,1.3,(31,2));ds=np.sort(np.stack([(x-u)**2+(y-v)**2 for u,v in pts]),axis=0)
    crack=np.exp(-((ds[1]-ds[0])/.006)**2)*(cloud*.4+.4)*(.55+.45*mid)
    im=mix(im,[130,83,42],crack)
    save('base-cookie',flecks(im,1700,[[118,76,44],[255,223,168],[173,118,57]],.026))
    side=tint(solid([197,140,77]),mid*18+grit*10+fine*7-y*13)
    save('base-cookie',flecks(side,700,[[144,94,48],[246,196,128]],.021),True)
def cake():
    radius=r+.018*cloud
    scrape=np.cos(44*radius+.64*np.sin(3*a)+.20*cloud)
    im=tint(solid([249,236,206]),cloud*3.5+grit*1.4+scrape*4+fine)
    im=mix(im,[255,248,225],np.maximum(0,scrape)**6*.32)
    save('base-cake',im)
    z=(1-y)/2
    # The finish is a lightly ridged ivory buttercream sleeve with a warm cake edge.
    bands=np.sin(z*52+1.1*np.sin(5*x)+.4*mid)
    side=tint(solid([245,224,188]),bands*5.8+cloud*5.5+grit*2.4+fine*1.7)
    side=mix(side,[212,177,129],(1-smooth(.035,.095,z+.016*np.sin(9*x)))*.62)
    side=mix(side,[255,245,217],smooth(.83,.96,z)*.63)
    save('base-cake',side,True)
def fruit():
    radial=np.hypot(x/(.80-.23*y),y/.95)
    im=tint(solid([214,49,56]),cloud*9+mid*4+fine*3)
    core=np.exp(-((x/(.11+.10*(1-y)))**2+(y/.86)**2))
    im=mix(im,[249,195,153],core*.90)
    veins=np.sin((x*12+np.sign(x)*y*6)+cloud)
    im=mix(im,[252,159,130],(veins*.5+.5)**10*np.exp(-((radial-.52)/.39)**2)*.45)
    im=mix(im,[144,29,46],smooth(.83,1,radial)*.63)
    for k in range(42):
        ang=k*2*np.pi/42;rr=.85+.055*math.sin(k*1.83)
        cx=math.cos(ang)*rr*.80;cy=math.sin(ang)*rr*.95;cx*=1-.27*cy
        im=mix(im,[252,200,106],np.exp(-ellipse(cx,cy,.016,.036,ang)**2*2.8)*.85)
    save('strawberry',im)
    mango=tint(solid([249,175,38]),cloud*8+mid*6+grit*2+fine)
    mango=mix(mango,[255,214,76],np.exp(-((x+.42)**2/.21+(y+.35)**2/.29))*.70)
    mango=mix(mango,[215,112,26],smooth(.53,.97,y)*.39)
    save('mango',mango)
    rr=np.hypot(x/.95,y/.81);theta=np.arctan2(y/.81,x/.95)
    kiwi=tint(solid([158,194,67]),cloud*8+mid*3.5+10*np.sin(theta*78+mid*.8)*np.exp(-((rr-.54)/.34)**2))
    kiwi=mix(kiwi,[236,227,153],np.exp(-((x/.29)**2+(y/.32)**2))*.95)
    kiwi=mix(kiwi,[115,131,54],smooth(.88,.99,rr)*.90)
    for i in range(47):
        ang=i*math.tau/47+rng.uniform(-.027,.027);rr2=rng.uniform(.35,.57);cx=rr2*.95*math.cos(ang);cy=rr2*.81*math.sin(ang)
        kiwi=mix(kiwi,[60,55,31],np.exp(-ellipse(cx,cy,.049,.019,ang)**2*2)*.94)
    save('kiwi',kiwi)
    rr=np.hypot(x/.94,y/.67);angle=np.arctan2((y+.13)/.66,x/.94)
    orange=tint(solid([248,156,38]),cloud*9+mid*12+grit*12)
    membranes=np.maximum(0,np.cos(6*angle))**38
    orange=mix(orange,[254,231,164],membranes*.86)
    orange=mix(orange,[255,230,156],np.exp(-((rr-.92)/.035)**2)*.95)
    orange=mix(orange,[229,126,26],smooth(.95,1,rr)*.85)
    save('orange',orange)
    berry=tint(solid([77,84,130]),cloud*18+mid*7+fine*3)
    berry=mix(berry,[116,137,170],np.exp(-((x+.35)**2/.22+(y+.40)**2/.26))*.71)
    blossom=.17+.045*np.cos(a*5);berry=mix(berry,[46,45,79],np.exp(-((r-blossom)/.049)**2)*.88+np.exp(-(r/.15)**2)*.45)
    save('blueberry',berry)
def vegetables():
    rr=np.hypot(x/.94,y/.89)
    tomato=tint(solid([222,72,49]),cloud*13+mid*4+fine*2)
    for i in range(5):
        ang=i*math.tau/5+.16;cx=.44*math.cos(ang);cy=.40*math.sin(ang);d=ellipse(cx,cy,.30,.19,ang)
        tomato=mix(tomato,[165,45,36],(1-smooth(.78,1.05,d))*.90)
        tomato=mix(tomato,[229,120,49],(1-smooth(.64,1,d))*.80)
        for j in range(7):
            t=j*.9+ang;rr2=.14+.055*math.sin(j)
            tomato=mix(tomato,[247,194,111],np.exp(-ellipse(cx+rr2*np.cos(t),cy+rr2*np.sin(t),.045,.024,t)**2*2)*.95)
    tomato=mix(tomato,[181,40,33],smooth(.86,.98,rr)*.85)
    save('tomato',tomato)
    rr=np.hypot(x/.98,y/.77)+.014*np.sin(a*5);onion=tint(solid([239,204,221]),cloud*3+fine*1.8)
    onion=mix(onion,[157,71,132],np.exp(-((rr-.93)/.035)**2)*.96+np.exp(-((rr-.72)/.022)**2)*.82)
    save('onion',onion)
    green=tint(solid([55,118,60]),cloud*18+mid*9+grit*15+fine*8)
    stalk=smooth(.01,.42,y);green=mix(green,tint(solid([135,181,102]),np.sin(x*63+y*6)*5+mid*7),stalk)
    green=flecks(green,1000,[[127,169,73],[39,88,49],[84,141,63]],.035)
    save('broccoli',green)
    leaf=tint(solid([77,139,64]),cloud*11+mid*6+grit*3)
    side=np.abs(y);vein=np.exp(-((y-.02*np.sin(x*7))/.022)**2)
    for xx in np.linspace(-.80,.65,7):vein+=np.exp(-((x-xx-side*.89)/.021)**2)*np.exp(-side*4)*.55
    save('basil',mix(leaf,[150,180,96],vein*.68))
def decorations():
    icing=tint(solid([249,228,188]),cloud*4.2+grit*2+fine)
    save('vanilla-flute',icing)
    save('icing',tint(solid([164,106,70]),cloud*9+mid*2+fine*2))
if __name__=='__main__':
    pizza();cookie();cake();fruit();vegetables();decorations()

def hi3d_materials():
    import json,struct,io
    file=OUT.parent/'rosette-display.glb';data=file.read_bytes()
    size=struct.unpack_from('<I',data,12)[0];doc=json.loads(data[20:20+size]);binary=memoryview(data)[28+size:]
    def attrib(i):
        a=doc['accessors'][i];bv=doc['bufferViews'][a['bufferView']];typ={5126:'<f4',5125:'<u4',5123:'<u2'}[a['componentType']]
        dims={'SCALAR':1,'VEC2':2,'VEC3':3}[a['type']]
        return np.frombuffer(binary,dtype=typ,count=a['count']*dims,offset=bv.get('byteOffset',0)+a.get('byteOffset',0)).reshape(a['count'],dims)
    mesh=doc['meshes'][0]['primitives'][0];pos=attrib(mesh['attributes']['POSITION']);uv=attrib(mesh['attributes']['TEXCOORD_0'])
    ids=attrib(mesh['indices']).reshape(-1,3);img=doc['images'][0];bv=doc['bufferViews'][img['bufferView']];off=bv.get('byteOffset',0)
    tex=np.asarray(Image.open(io.BytesIO(binary[off:off+bv['byteLength']])).convert('RGB'))
    lo=pos.min(axis=0);hi=pos.max(axis=0);center=(lo+hi)/2
    scale=(SIZE-1)*(59/63)/max(hi[0]-lo[0],hi[2]-lo[2]);xy=(pos[:,[0,2]]-center[[0,2]])*scale+(SIZE-1)*.5
    pixels=solid([202,145,152]);zbuffer=np.full((SIZE,SIZE),-np.inf)
    for inds in ids:
        pts=xy[inds];xmin,ymin=np.maximum(0,np.ceil(pts.min(axis=0))).astype(int);xmax,ymax=np.minimum(SIZE-1,np.floor(pts.max(axis=0))).astype(int)
        if xmax<xmin or ymax<ymin:continue
        yy,xx=np.mgrid[ymin:ymax+1,xmin:xmax+1];a,b,c=pts;den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
        if abs(den)<1e-8:continue
        w0=((b[1]-c[1])*(xx-c[0])+(c[0]-b[0])*(yy-c[1]))/den;w1=((c[1]-a[1])*(xx-c[0])+(a[0]-c[0])*(yy-c[1]))/den;w2=1-w0-w1
        z=w0*pos[inds[0],1]+w1*pos[inds[1],1]+w2*pos[inds[2],1];hit=(w0>=0)&(w1>=0)&(w2>=0)&(z>=zbuffer[yy,xx])
        if not hit.any():continue
        tuv=w0[...,None]*uv[inds[0]]+w1[...,None]*uv[inds[1]]+w2[...,None]*uv[inds[2]]
        tx=np.clip((tuv[...,0]*(tex.shape[1]-1)).astype(int),0,tex.shape[1]-1);ty=np.clip((tuv[...,1]*(tex.shape[0]-1)).astype(int),0,tex.shape[0]-1)
        pixels[yy[hit],xx[hit]]=tex[ty[hit],tx[hit]];zbuffer[yy[hit],xx[hit]]=z[hit]
    save('hi-rosette',pixels)
    save('hi-flower',tint(solid([216,140,120]),cloud*6+grit*3))
if __name__=='__main__':hi3d_materials()
