"""Reproducible procedural food extrusion product renders. Blender 4.3+.
Run: blender -b -t 8 --python render_recipes.py
Outputs six 900x675 PNGs; convert with accompanying pack_assets.py.
"""
import bpy, math, os
from mathutils import Vector
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "recipes")
os.makedirs(OUT, exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
sc=bpy.context.scene; sc.render.engine='CYCLES'; sc.cycles.samples=64; sc.cycles.use_denoising=False
sc.render.resolution_x=900; sc.render.resolution_y=675; sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG'; sc.world.color=(.6,.6,.6)
sc.view_settings.view_transform='AgX'; sc.view_settings.look='AgX - Medium High Contrast'

def material(name,color,rough=.42,noise=.07):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
 n=m.node_tree.nodes; p=n.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1); p.inputs['Roughness'].default_value=rough
 p.inputs['Subsurface Weight'].default_value=.065; p.inputs['Subsurface Radius'].default_value=(.25,.12,.06)
 t=n.new('ShaderNodeTexNoise'); t.inputs['Scale'].default_value=115; t.inputs['Detail'].default_value=3
 b=n.new('ShaderNodeBump'); b.inputs['Strength'].default_value=noise; b.inputs['Distance'].default_value=.018
 m.node_tree.links.new(t.outputs['Fac'],b.inputs['Height']);m.node_tree.links.new(b.outputs['Normal'],p.inputs['Normal'])
 return m
mats={'dough':material('Warm rice biscuit',(.68,.42,.20),.54,.22),'pink':material('Strawberry puree',(.68,.12,.16),.3,.055),'cream':material('Milk candy center',(.91,.72,.43),.38,.06),'choc':material('Dark cocoa chocolate',(.105,.038,.018),.3,.06),'rice':material('Golden rice biscuit',(.78,.56,.30),.54,.22)}
ground=material('Warm sage white backdrop',(.91,.93,.88),.8,0)
bpy.ops.mesh.primitive_plane_add(size=200); bpy.context.object.name='Backdrop'; bpy.context.object.data.materials.append(ground)
def aim(o,p): o.rotation_euler=(Vector(p)-o.location).to_track_quat('-Z','Y').to_euler()
for name,loc,energy,size in [('Softbox left',(-3,-4,6),420,4),('Soft fill',(4,0,4),150,3),('Back rim',(0,4,5),230,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=energy;o.data.shape='DISK';o.data.size=size;aim(o,(0,0,0))
bpy.ops.object.camera_add(location=(0,-3.7,4.4)); cam=bpy.context.object;aim(cam,(0,0,.12));cam.data.type='ORTHO';cam.data.ortho_scale=2.55;sc.camera=cam
objects=[]
def circle(r=1,n=160):return [(r*math.cos(i*math.tau/n),r*math.sin(i*math.tau/n)) for i in range(n)]
def curve_line(points,z,radius,mat,name):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=radius;c.bevel_resolution=3;c.resolution_u=1
 s=c.splines.new('POLY');s.points.add(len(points)-1)
 for v,(x,y) in zip(s.points,points):v.co=(x,y,z,1)
 s.use_cyclic_u=True;o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(mat);objects.append(o)
def food(points,mat,h=.22,pos=(0,0),loops=True):
 # A solid bevelled, closed extrusion plus physically modeled extrusion layers.
 pts=[(x+pos[0],y+pos[1]) for x,y in points]
 if len(points)==240 and mat==mats['pink']:
  n=len(pts);verts=[(x,y,z) for z in (.018,h+.018) for x,y in pts]
  faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
  mesh=bpy.data.meshes.new('Heart solid');mesh.from_pydata(verts,[],faces);mesh.update()
  o=bpy.data.objects.new('Printed heart',mesh);bpy.context.collection.objects.link(o);o.data.materials.append(mat);objects.append(o)
  bevel=o.modifiers.new('Soft food edges','BEVEL');bevel.width=.013;bevel.segments=3
  bevel.use_clamp_overlap=True
 else:
  c=bpy.data.curves.new('Extruded food solid','CURVE');c.dimensions='2D';c.resolution_u=1;c.fill_mode='BOTH';c.extrude=h/2-.016;c.bevel_depth=.016;c.bevel_resolution=3
  s=c.splines.new('POLY');s.points.add(len(pts)-1)
  for v,(x,y) in zip(s.points,pts):v.co=(x,y,0,1)
  s.use_cyclic_u=True;o=bpy.data.objects.new('Printed food',c);bpy.context.collection.objects.link(o);o.location.z=h/2+.018;o.data.materials.append(mat);objects.append(o)
 for i in range(1,7):curve_line(pts,.035+i*(h-.025)/7,.011,mat,'Extrusion side layer')
 if loops:
  # Concentric print paths slightly embedded in the surface.
  for j in range(1,13):
   scale=1-j/14
   pp=[(x*scale+pos[0],y*scale+pos[1]) for x,y in points]
   curve_line(pp,h+.017,.0065,mat,'Top concentric toolpath')
 return o

def union_circles(circles):
 pts=[]
 for i in range(360):
  a=i*math.tau/360;ux,uy=math.cos(a),math.sin(a);rs=[]
  for cx,cy,r in circles:
   d=cx*ux+cy*uy;disc=d*d-(cx*cx+cy*cy-r*r)
   if disc>=0:rs.append(d+math.sqrt(disc))
  rad=max(rs);pts.append((rad*ux,rad*uy))
 return pts

def star(r):
 return [(r*(1 if i%2==0 else .48)*math.cos(math.pi/2+i*math.tau/10),r*(1 if i%2==0 else .48)*math.sin(math.pi/2+i*math.tau/10)) for i in range(10)]
for recipe in ['bear','flower','star','berry','cocoa','petal']:
 if os.environ.get('RECIPE') and recipe!=os.environ['RECIPE']:continue
 for o in objects:bpy.data.objects.remove(o,do_unlink=True)
 objects=[];cam.data.ortho_scale=2.55
 if recipe=='bear':food(union_circles([(0,-.12,.60),(-.46,.34,.24),(.46,.34,.24)]),mats['dough'],.23)
 elif recipe=='flower':
  for i in range(5):
   a=math.pi/2+i*math.tau/5;food(circle(.31),mats['pink'],.22,(.47*math.cos(a),.47*math.sin(a)))
  food(circle(.27),mats['cream'],.265)
 elif recipe=='star':
  food([(x*.52,y*.52*.35) for x,y in circle()],mats['choc'],.21,(-.38,-.18))
  food([(x*.34,y*.34*.35) for x,y in circle()],mats['choc'],.21,(-.26,-.41))
  food(star(.53),mats['choc'],.24,(.34,.13));cam.data.ortho_scale=2.65
 elif recipe=='berry':
  pts=[]
  for i in range(240):
   a=i*math.tau/240;pts.append((.78*math.sin(a)**3,.78*(13*math.cos(a)-5*math.cos(2*a)-2*math.cos(3*a)-math.cos(4*a))/17))
  food(pts,mats['pink'],.25)
 elif recipe=='cocoa':food(star(.80),mats['choc'],.25)
 elif recipe=='petal':
  pts=[]
  for i in range(240):
   a=i*math.tau/240;r=.78*(.82+.17*math.cos(6*a));pts.append((r*math.cos(a),r*math.sin(a)))
  food(pts,mats['rice'],.23)
 sc.render.filepath=os.path.join(OUT,recipe+'.png');bpy.ops.render.render(write_still=True)
 print('FINISHED_ASSET '+recipe,flush=True)
