"""Bake material maps for the fruit, vegetable, piping and sugar shapes in the studio."""
from render_food_materials import np, x, y, a, r, cloud, mid, grit, fine, solid, mix, smooth, ellipse, tint, save, rng, flecks

def skin(rgb, variation=1):
    return tint(solid(rgb), (cloud*8+mid*4+fine*2)*variation)

def highlight(im, cx, cy, rx, ry, color, weight):
    return mix(im,color,np.exp(-ellipse(cx,cy,rx,ry)**2*2)*weight)

berry=skin([207,39,50],1.4)
berry=highlight(berry,-.27,-.33,.49,.45,[249,124,104],.62)
for row in range(-3,4):
    for col in range(-3,4):
        cx=col*.24+abs(row%2)*.12+rng.uniform(-.03,.03)
        cy=row*.24+rng.uniform(-.04,.04)
        berry=highlight(berry,cx,cy,.042,.058,[136,34,42],.94)
        berry=highlight(berry,cx-.004,cy+.008,.021,.037,[251,201,106],.98)
save('strawberry-half',berry)
cherry=skin([155,26,50])
cherry=highlight(cherry,-.24,.02,.17,.23,[255,192,178],.93)
cherry=highlight(cherry,.46,.45,.19,.44,[221,76,71],.8)
stem=(y<-.32)&(ellipse(0,.26,.67,.63)>1)
save('cherry',mix(cherry,[106,119,51],stem))
berry=skin([170,43,70])
for row in range(-2,3):
    for col in range(-2,3):
        cx=col*.33+(int(np.sign(row))*abs(row%2))*.14;cy=row*.34
        berry=highlight(berry,cx,cy,.22,.23,[227,94,113],.78)
        berry=highlight(berry,cx-.06,cy-.05,.12,.11,[248,156,165],.49)
save('raspberry',berry)
rr=ellipse(0,0,.94,.78)
im=skin([255,207,141])
im=mix(im,[225,106,102],smooth(.78,.97,rr)*.90)
save('peach',mix(im,[248,169,116],(np.cos(39*a+3*cloud)*.5+.5)**10*.21))
rr=np.hypot(x/(.68+.21*y),y/.94)
im=skin([190,79,96])
im=mix(im,[251,207,169],smooth(.66,.82,rr))
im=mix(im,[123,75,94],smooth(.87,.99,rr))
seeded=flecks(im,700,[[249,191,115],[244,157,123],[158,65,87]],.027)
save('fig',mix(im,seeded,1-smooth(.71,.85,rr)))
rr=ellipse(0,0,.87,.77)/(1+.11*np.cos(3*a))
im=mix(skin([250,180,47]),[238,118,28],smooth(.86,1,rr))
save('pepper-ring',mix(im,[255,223,129],np.exp(-((rr-.715)/.05)**2)*.9))
im=skin([251,207,69])
save('corn',highlight(im,.15,.54,.32,.28,[255,233,152],.84))
im=skin([236,218,190])
rr=ellipse(0,-.20,.93,.65)
im=mix(im,[173,142,113],smooth(.83,1,rr)*(y<.15)*.70)
im=mix(im,[154,122,102],(y>-.05)*(y<.15)*(abs(x)>.20)*(.65+.15*np.sin(35*x)))
save('mushroom',im)
rr=ellipse(0,0,.94,.80)
im=skin([80,69,62])
save('olive',mix(im,[137,120,101],np.exp(-((rr-.84)/.12)**2)*.6))
im=skin([72,133,73],1.35)
vein=np.exp(-((y+.03*np.sin(5*x))/.018)**2)
for cx in np.linspace(-.73,.67,7):
    vein+=np.exp(-((x-cx-np.abs(y)*.85)/.019)**2)*np.exp(-3*abs(y))*.65
save('mint',mix(im,[160,187,115],vein*.78))
save('cocoa-shell',tint(skin([146,87,64]),9*np.cos(26*x/(1.6+y))))
save('pink-ribbon',tint(skin([240,174,187],.58),4*np.sin(16*x)))
save('sugar-heart',skin([235,150,162],.65))
save('sugar-moon',skin([242,214,126],.6))
save('sugar-star',skin([248,198,99],.64))
daisy=mix(skin([252,235,208],.63),[240,170,73],1-smooth(.19,.27,r))
save('sugar-daisy',daisy)
