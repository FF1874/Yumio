"""Render the five food cartridges from one cross section. Run with NumPy/SciPy/Pillow."""
from pathlib import Path
import math

import numpy as np
from PIL import Image
from scipy.interpolate import PchipInterpolator

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/capsules"
OUT.mkdir(exist_ok=True)
SIZE = 620
SCALE = 210
YAW, PITCH = .26, .105
RIGHT = np.array([math.cos(YAW), 0, -math.sin(YAW)])
CAMERA = np.array([math.sin(YAW)*math.cos(PITCH), math.sin(PITCH), math.cos(YAW)*math.cos(PITCH)])
UP = np.cross(CAMERA, RIGHT)

def norm(v):
    return v / np.maximum(1e-10, np.linalg.norm(v,axis=-1,keepdims=True))

def rgb(code):
    return np.array([int(code[i:i+2],16) for i in (0,2,4)], dtype=float)/255

def outline_mesh(profile, order=5, density=46):
    # A rounded rectangle in plan with an asymmetric taper below the reservoir.
    data=np.array(profile)
    ys=np.unique(np.concatenate([data[:,0], np.linspace(data[0,0],data[-1,0],density)]))
    left,right,depth=PchipInterpolator(data[:,0],data[:,1:],axis=0)(ys).T
    theta=np.arange(80)*2*math.pi/80
    co,si=np.cos(theta),np.sin(theta)
    xf=np.sign(co)*abs(co)**(2/order)
    zf=np.sign(si)*abs(si)**(2/order)
    xc=(right+left)/2
    verts=np.stack([xc[:,None]+(right-left)[:,None]/2*xf, ys[:,None]+np.zeros_like(xf), depth[:,None]*zf],axis=2)
    dv=np.gradient(verts,ys,axis=0)
    du=np.roll(verts,-1,axis=1)-np.roll(verts,1,axis=1)
    normals=norm(np.cross(dv,du))
    return verts,normals

class Renderer:
    def __init__(self):
        self.color=np.zeros((SIZE,SIZE,4),dtype=np.uint8)
        self.depth=np.full((SIZE,SIZE),-100.)
    def mesh(self,profile,material,base,order=5,density=35):
        verts,normals=outline_mesh(profile,order,density)
        xyz=verts.reshape(-1,3)
        po=np.stack([SIZE/2+(xyz@RIGHT)*SCALE, SIZE*.864-(xyz@UP)*SCALE, xyz@CAMERA],axis=1)
        nn=normals.reshape(-1,3)
        cols=self.shade(nn,material,rgb(base),xyz)
        rings,segments=verts.shape[:2]
        def draw(ids):
            p=po[ids]
            a,b,c=p
            den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
            if den<=1e-5:
                return
            x0,y0=np.maximum(np.floor(p[:,:2].min(axis=0)),0).astype(int)
            x1,y1=np.minimum(np.ceil(p[:,:2].max(axis=0)),SIZE-1).astype(int)
            if x1<x0 or y1<y0:return
            yy,xx=np.mgrid[y0:y1+1,x0:x1+1];xx=xx+.5;yy=yy+.5
            u=((b[1]-c[1])*(xx-c[0])+(c[0]-b[0])*(yy-c[1]))/den
            v=((c[1]-a[1])*(xx-c[0])+(a[0]-c[0])*(yy-c[1]))/den
            w=1-u-v
            zz=u*a[2]+v*b[2]+w*c[2]
            buf=self.depth[y0:y1+1,x0:x1+1]
            mask=(np.minimum.reduce([u,v,w])>=-1e-7)&(zz>buf)
            if not np.any(mask):return
            buf[mask]=zz[mask]
            colors=cols[ids]
            pixel=u[...,None]*colors[0]+v[...,None]*colors[1]+w[...,None]*colors[2]
            self.color[y0:y1+1,x0:x1+1][mask,:3]=(np.clip(pixel[mask],0,1)*255+.5).astype('uint8')
            self.color[y0:y1+1,x0:x1+1][mask,3]=255
        for row in range(rings-1):
            for j in range(segments):
                a=row*segments+j;b=row*segments+(j+1)%segments;c=a+segments;d=b+segments
                draw([a,b,c]);draw([b,d,c])
    def shade(self,n,mat,color,pos):
        key=norm(np.array([-.65,.60,.70])); bounce=norm(np.array([.8,-.35,.2]))
        facing=np.maximum(0,n@CAMERA)
        lambert=np.maximum(0,n@key)
        reflect=2*(n@CAMERA)[:,None]*n-CAMERA
        def box(light,exponent):
            return np.maximum(0,reflect@norm(np.array(light)))**exponent
        power=(.72+.23*lambert+.05*np.maximum(0,n@bounce))[:,None]
        if mat=='food':
            light=box([-.50,.22,.78],22)*.15+box([.85,.25,-.1],15)*.17
            rim=(1-facing)**3*.24
            return color*power + (light+rim)[:,None]
        if mat=='clear':
            light=box([-.58,.30,.8],18)*.38+box([.72,.12,.43],14)*.48
            return color*(.62+.31*lambert[:,None])+(light+.18*(1-facing)**2)[:,None]
        if mat=='band':
            return color*(.55+.5*lambert[:,None])+(box([-.65,.14,.8],9)*.14+box([.8,.14,.4],10)*.10)[:,None]
        return color*(.71+.27*lambert[:,None])+(box([-.3,.4,.75],18)*.18)[:,None]

def collar(y0,y1,width,depth,roll):
    return [(y0,-width+roll,width-roll,depth-roll),(y0+roll,-width,width,depth),
            (y1-roll,-width,width,depth),(y1, -width+roll,width-roll,depth-roll),
            (y1+.001,-.02,.02,.01)]

# All five fillings share the same replaceable single-nozzle shell.
cartridges=['874d37','e4aa6f','da994e','df7672','583d35']
body=[
 (.12,.106,.337,.115),(.24,.095,.351,.135),(.34,.055,.386,.159),
 (.47,-.094,.471,.192),(.59,-.243,.538,.225),(.81,-.478,.587,.261),
 (.94,-.566,.60,.274),(1.08,-.602,.60,.274),(1.76,-.602,.60,.274),
 (1.86,-.594,.594,.271),(1.89,-.564,.564,.26)]
def render(color):
    r=Renderer()
    # Exposed shell walls have a distinct lower edge, continuing into the integrated nozzle.
    shell=Renderer()
    shell.mesh(body,'clear','e4ddc9')
    inner=[(y,left+.021,right-.021,max(.05,depth-.018)) for y,left,right,depth in body]
    r.mesh(inner,'food',color)
    # A thin clear wall transmits the food colour even along the return at the side.
    glass=shell.color[:,:,3]>0
    inside=r.color[:,:,3]>0
    rim=glass & ~inside
    r.color[rim]=shell.color[rim]
    r.color[inside,:3]=(.93*r.color[inside,:3]+.07*shell.color[inside,:3]).astype('uint8')
    # The front of the clear reservoir catches a long softbox and a narrow top glint.
    yy,xx=np.mgrid[:SIZE,:SIZE]
    local_x=(xx-SIZE/2)/SCALE
    local_y=(SIZE*.864-yy)/SCALE
    ribbon=np.exp(-((local_x+.49)/.047)**2)*np.exp(-((local_y-1.64)/.41)**2)
    top=np.exp(-((local_y-1.831+.017*local_x)/.025)**2)*np.exp(-((local_x+.15)/.46)**4)
    gloss=np.clip(.27*ribbon+.31*top,0,.5)
    enamel=r.color[:,:,:3]
    enamel[inside]=enamel[inside]+(252-enamel[inside].astype(float))*gloss[inside,None]
    # Short molded nozzle under the asymmetrically tapered shoulders.
    r.mesh([(.068,.111,.326,.109),(.083,.101,.335,.117),(.120,.101,.335,.117),
            (.138,.105,.335,.117)],'clear','cfc9b9',order=3,density=8)
    r.mesh(collar(1.88,1.942,.619,.286,.012),'band','353933',density=14)
    r.mesh(collar(1.945,2.012,.613,.284,.013),'clear','d7d4c7',density=14)
    r.mesh(collar(2.012,2.135,.631,.301,.026),'cap','f5e8d2',density=24)
    # Soft oval contact shadow on the transparent studio floor.
    yy,xx=np.mgrid[:SIZE,:SIZE];sx=SIZE*.57;sy=SIZE*.844
    shade=.14*np.exp(-((xx-sx)/66)**2-((yy-sy)/8)**2)+.15*np.exp(-((xx-sx)/22)**2-((yy-sy)/4)**2)
    sr=np.zeros_like(r.color);sr[:,:,:3]=[106,89,65];sr[:,:,3]=(shade*255).astype('uint8')
    return Image.alpha_composite(Image.fromarray(sr),Image.fromarray(r.color)).resize((400,400),Image.Resampling.LANCZOS)
if __name__=='__main__':
    for index,color in enumerate(cartridges):
        render(color).save(OUT/f'{index}.webp',quality=93,method=6)
