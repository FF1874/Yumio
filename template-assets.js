// A template owns the food pieces its workspace offers and the starting assembly.
const templateArtRoot = 'assets/templates/';
function templateAsset(key, kind, group, size, color, surface = '') {
  const sourceModel=surface==='hi-flower' ? 'assets/model-import/flower-display.glb' : surface==='hi-rosette' ? templateArtRoot+'rosette-display.glb' : '';
  return {key, kind, name: kind, group, size, color, surface, sourceModel, thumb: templateArtRoot + key + '.webp'};
}
const legacyWorkshopTemplates = {
  sandwich: {
    id: 'sandwich', name: '夹心点心', action: '叠饼片、夹心和顶饰', cover: templateArtRoot + 'sandwich.webp',
    parts: [
      templateAsset('petal-base','六瓣米饼','底座',.78,'#dca569'),
      templateAsset('tart','花边塔壳','底座',.77,'#cc955c'),
      templateAsset('berry','莓果夹心','夹心',.66,'#ac4760'),
      templateAsset('cream','香草夹片','夹心',.68,'#ecd1a0','cream'),
      templateAsset('rosette','Hi3D 玫瑰顶饰','顶饰',.28,'#d18789','hi-rosette'),
      templateAsset('pearl','小珍珠','顶饰',.12,'#eee0c4')
    ],
    preset: [['petal-base',0,0,.81],['berry',0,0,.71],['cream',0,0,.69],['petal-base',0,0,.72],['rosette',-.03,0,.28]]
  },
  chocolate: {
    id: 'chocolate', name: '造型巧克力', action: '排图案、加浮雕', cover: templateArtRoot + 'chocolate.webp',
    parts: [
      templateAsset('tablet','圆角巧克力牌','主体',.8,'#895742','tablet'),
      templateAsset('medallion','椭圆徽章','主体',.78,'#845441','medallion'),
      templateAsset('hi-flower','Hi3D 花瓣浮雕','浮雕',.32,'#d89880','hi-flower'),
      templateAsset('cocoa','可可豆形','浮雕',.27,'#a07555'),
      templateAsset('letter','字母 A','点缀',.24,'#ddc097','letter'),
      templateAsset('star','五角星','点缀',.18,'#efca7e','star')
    ],
    preset: [['tablet',0,0,.85],['hi-flower',-.26,.04,.38],['letter',.32,-.02,.22]]
  },
  animal: {
    id: 'animal', name: '动物造型', action: '拼耳朵、爪子和表情', cover: templateArtRoot + 'animal.webp',
    parts: [
      templateAsset('bun','圆脸糕体','主体',.65,'#dca976','bun'),
      templateAsset('round-ear','圆熊耳','耳朵',.26,'#bc865e','round-ear'),
      templateAsset('rabbit-ear','长兔耳','耳朵',.32,'#d89f81','rabbit-ear'),
      templateAsset('paw','小爪子','表情',.21,'#e9bd96','paw'),
      templateAsset('eye','可可眼睛','表情',.08,'#634538','eye'),
      templateAsset('muzzle','椭圆鼻口','表情',.22,'#ecd2a9','muzzle')
    ],
    preset: [['round-ear',-.48,-.43,.28],['round-ear',.48,-.43,.28],['bun',0,.02,.67],['eye',-.22,.02,.075],['eye',.22,.02,.075],['muzzle',0,.24,.24],['eye',0,.21,.095]]
  }
};
const foodLibrary = [
  templateAsset('strawberry','草莓切片','水果',.26,'#d94649','strawberry'),
  templateAsset('mango','芒果丁','水果',.24,'#efaf34','mango'),
  templateAsset('kiwi','奇异果片','水果',.24,'#8cb944','kiwi'),
  templateAsset('orange','橙瓣','水果',.25,'#eb9d31','orange'),
  templateAsset('blueberry','蓝莓','水果',.13,'#536389','blueberry'),
  templateAsset('tomato','番茄切片','蔬菜',.27,'#d75339','tomato'),
  templateAsset('onion','紫洋葱圈','蔬菜',.26,'#b577a1','onion'),
  templateAsset('broccoli','西兰花','蔬菜',.22,'#4b8439','broccoli'),
  templateAsset('basil','罗勒叶','蔬菜',.23,'#5b984b','basil'),
  templateAsset('vanilla-flute','香草挤花','裱花',.22,'#f8e8c7','vanilla-flute'),
  templateAsset('rosette','Hi3D 玫瑰顶饰','裱花',.23,'#d18789','hi-rosette'),
  templateAsset('hi-flower','Hi3D 花瓣浮雕','裱花',.25,'#d89880','hi-flower'),
  templateAsset('strawberry-half','半颗草莓','水果',0.25,'#d94446','strawberry-half'),
  templateAsset('cherry','带梗樱桃','水果',0.19,'#b82b46','cherry'),
  templateAsset('raspberry','红树莓','水果',0.18,'#c94e68','raspberry'),
  templateAsset('peach','蜜桃瓣','水果',0.25,'#f3a47e','peach'),
  templateAsset('fig','无花果切片','水果',0.24,'#a75570','fig'),
  templateAsset('pepper-ring','黄彩椒圈','蔬菜',0.25,'#efad31','pepper-ring'),
  templateAsset('corn','甜玉米粒','蔬菜',0.15,'#f1c84b','corn'),
  templateAsset('mushroom','口蘑切片','蔬菜',0.22,'#dbc4a5','mushroom'),
  templateAsset('olive','黑橄榄圈','蔬菜',0.17,'#534a43','olive'),
  templateAsset('mint','薄荷叶','蔬菜',0.2,'#5a9355','mint'),
  templateAsset('cocoa-shell','可可贝壳裱花','裱花',0.21,'#9a6148','cocoa-shell'),
  templateAsset('pink-ribbon','莓果波纹裱花','裱花',0.22,'#ecadb8','pink-ribbon'),
  templateAsset('sugar-heart','爱心糖片','图案',0.19,'#ec99a3','sugar-heart'),
  templateAsset('sugar-daisy','雏菊糖花','图案',0.2,'#f8e8c9','sugar-daisy'),
  templateAsset('sugar-moon','月牙糖片','图案',0.18,'#f3d778','sugar-moon'),
  templateAsset('sugar-star','星星糖片','图案',0.19,'#f2c05a','sugar-star'),
  ...Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ',char=>
    templateAsset('icing-'+char,'字母 '+char,'字母',.20,'#a06948','icing-'+char))
];
const foodBases = {
  pizza: templateAsset('base-pizza','窑烤披萨底','底座',1.08,'#cc8c4f','base-pizza'),
  cookie: templateAsset('base-cookie','黄油饼干底','底座',1.02,'#cc995e','base-cookie'),
  cake: templateAsset('base-cake','奶油蛋糕底','底座',1,'#f3dfb6','base-cake')
};
const workshopTemplates = Object.fromEntries([
  ['pizza','披萨','摆上番茄、洋葱和西兰花'],
  ['cookie','饼干','用字母和小花装饰饼面'],
  ['cake','蛋糕','铺上水果，挤一圈奶油花']
].map(([id,name,action])=>[id,{id,name,action,cover:templateArtRoot+id+'.webp',base:foodBases[id],parts:foodLibrary}]));
const allTemplateAssets = new Map([
  ...Object.values(legacyWorkshopTemplates).flatMap(t=>t.parts),...foodLibrary,...Object.values(foodBases)
].map(asset=>[asset.key,asset]));
function templateAssetByKey(key){return allTemplateAssets.get(key)}
function baseOutline(surface,a) {
  const wave=Math.cos(5*a+.4)*.010+Math.cos(9*a-.6)*.007+Math.cos(17*a)*.005;
  return surface==='base-cake' ? .948+wave*.24 : surface==='base-pizza' ? .95+wave : .948+wave*.55;
}
// Values are top elevations in normalized coordinates. A null sample is outside the mesh.
function templateHeight(surface, x, y) {
  const ellipse = (rx, ry, dx=0, dy=0) => Math.hypot((x-dx)/rx,(y-dy)/ry);
  const dome = r => Math.sqrt(Math.max(0,1-r*r));
  let r;
  switch (surface) {
    case 'base-pizza': {
      const a=Math.atan2(y,x);r=Math.hypot(x,y)/baseOutline(surface,a);
      return r>1 ? null : .19+.025*(1-r*r)+.20*Math.exp(-(((r-.87)/.14)**2))*(.94+.10*Math.sin(a*8))
        +.012*Math.cos(10*x)*Math.sin(15*y);
    }
    case 'base-cookie': {
      const a=Math.atan2(y,x);r=Math.hypot(x,y)/baseOutline(surface,a);
      return r>1 ? null : .18+.12*dome(r)+.018*Math.cos(8*x+4*y)*Math.cos(7*y-2*x);
    }
    case 'base-cake': {
      const a=Math.atan2(y,x);r=Math.hypot(x,y)/baseOutline(surface,a);
      return r>1 ? null : .78-.085*Math.max(0,(r-.88)/.12)**1.8+.008*Math.sin(42*r+1.9*a)*Math.min(1,r*4);
    }
    case 'strawberry': {
      r=ellipse(.80-.23*y,.95);
      return r>1 ? null : .16+.20*dome(r);
    }
    case 'mango': {
      r=(Math.abs((x+.07*y)/.88)**4+Math.abs(y/.75)**4)**.25;
      return r>1 ? null : .25+.30*dome(r);
    }
    case 'kiwi':
      r=ellipse(.95,.81);return r>1 ? null : .15+.10*dome(r);
    case 'orange': {
      r=ellipse(.94,.67);if(r>1||y<-.13)return null;
      return .17+.18*dome(r);
    }
    case 'blueberry':
      r=ellipse(.91,.88);return r>1 ? null : .14+.69*dome(r)-.08*Math.exp(-((r/.22)**2));
    case 'tomato':
      r=ellipse(.94,.89);return r>1 ? null : .15+.12*dome(r);
    case 'onion': {
      const a=Math.atan2(y,x);r=ellipse(.98,.77)+.014*Math.sin(a*5);
      return r>1||r<.65 ? null : .16+.15*Math.sin((r-.65)/.35*Math.PI);
    }
    case 'broccoli': {
      const bulbs=[[-.52,-.25,.43],[-.17,-.52,.46],[.25,-.51,.45],[.54,-.23,.42],[.23,-.04,.43],[-.23,-.04,.43]];
      const heights=bulbs.map(([cx,cy,rad])=>{const d=Math.hypot(x-cx,y-cy)/rad;return d>1?0:.18+.50*dome(d)});
      const stalk=(Math.abs(x)<.24+.14*Math.max(0,.6-y)&&y>.05&&y<.85&&ellipse(.36,.88)<1.1)?.22:0;
      return Math.max(...heights,stalk)||null;
    }
    case 'basil': {
      r=ellipse(.94,.52*(1-.54*Math.abs(x)));return r>1 ? null : .14+.18*dome(r)+.045*Math.exp(-((y/.075)**2));
    }
    case 'vanilla-flute': {
      const a=Math.atan2(y,x);r=Math.hypot(x,y)/(.84+.115*Math.cos(8*a));
      return r>1 ? null : .15+.68*(1-r**1.4)+.12*Math.cos(8*a-3.4*r)*Math.sin(Math.PI*r);
    }
    case 'strawberry-half': {
      r=ellipse(.79-.24*y,.95);
      return r>1 ? null : .15+.67*dome(r);
    }
    case 'cherry': {
      r=ellipse(.67,.63,0,.26);
      if(r<=1)return .14+.72*dome(r)-.10*Math.exp(-((x/.17)**2+((y+.24)/.22)**2));
      const stemX=.09+.36*(-y-.28)**2;
      return y<-.25&&y>-.97&&Math.abs(x-stemX)<.06 ? .28+.12*(-y) : null;
    }
    case 'raspberry': {
      const silhouette=ellipse(.84-.20*y,.86);
      if(silhouette>1)return null;
      let bump=0;
      for(let row=-2;row<=2;row++)for(let col=-2;col<=2;col++){
        const d=Math.hypot((x-col*.33-(row%2)*.14)/.24,(y-row*.34)/.23);
        bump=Math.max(bump,d<1 ? dome(d) : 0);
      }
      return .16+.48*dome(silhouette)+.15*bump;
    }
    case 'peach': {
      r=ellipse(.94,.78);
      if(r>1 || y>-.15 && ellipse(.68,.60,.09,.30)<1)return null;
      return .13+.40*dome(r);
    }
    case 'fig': {
      r=ellipse(.68+.21*y,.94);
      return r>1 ? null : .14+.16*dome(r);
    }
    case 'pepper-ring': {
      const a=Math.atan2(y,x);
      r=ellipse(.87,.77)/(1+.11*Math.cos(3*a));
      return r>1||r<.68 ? null : .15+.14*Math.sin((r-.68)/.32*Math.PI);
    }
    case 'corn': {
      r=(Math.abs(x/(.71+.11*y))**3.2+Math.abs(y/.81)**3.2)**(1/3.2);
      return r>1 ? null : .16+.49*dome(r);
    }
    case 'mushroom': {
      const cap=ellipse(.93,.65,0,-.20),stalk=ellipse(.30+.08*y,.66,0,.23);
      if(y<.15 && cap<=1)return .20+.18*dome(cap);
      return stalk<=1 ? .17+.13*dome(stalk) : null;
    }
    case 'olive':
      r=ellipse(.94,.80);
      return r>1||ellipse(.50,.40,-.06,.02)<1 ? null : .16+.19*dome(r);
    case 'mint': {
      const a=Math.atan2(y,x);
      r=ellipse(.93,.56*(1-.55*Math.abs(x)))/(1+.035*Math.sin(21*a));
      return r>1 ? null : .14+.16*dome(r)+.06*Math.exp(-((y/.07)**2));
    }
    case 'cocoa-shell': {
      const a=Math.atan2(y,x);
      r=ellipse(.66+.24*y,.94)/(1+.075*Math.cos(10*a));
      return r>1 ? null : .14+.48*dome(r)+.10*Math.cos(26*x/(1.6+y))*dome(r);
    }
    case 'pink-ribbon': {
      const d=ellipse(.94,.27,0,.31*Math.sin(4.1*x));
      return d>1 ? null : .14+.32*dome(d)+.055*Math.cos(16*x)*dome(d);
    }
    case 'sugar-heart': {
      const xx=x*1.25,yy=-y*1.22+.14;
      const shape=(xx*xx+yy*yy-1)**3-xx*xx*yy**3;
      return shape>.01 ? null : .18+.18*Math.min(1,Math.max(0,-shape*5));
    }
    case 'sugar-daisy': {
      const a=Math.atan2(y,x);
      r=Math.hypot(x,y)/(.69+.24*Math.cos(8*a));
      return r>1 ? null : .14+.18*dome(r)+.18*Math.exp(-((Math.hypot(x,y)/.26)**4));
    }
    case 'sugar-moon':
      r=ellipse(.83,.91);
      return r>1||ellipse(.72,.78,.37,-.20)<1 ? null : .14+.20*dome(r);
    case 'sugar-star':
      return templateHeight('star',x,y);
    case 'cream':
      r = ellipse(.98,.88); return r>1 ? null : .17+.14*dome(r)+.023*Math.cos(r*34);
    case 'tablet': {
      const edge = (Math.abs(x)**5 + Math.abs(y/.72)**5)**.2;
      return edge>1 ? null : .23+.13*Math.min(1,(1-edge)*11)+.05*Math.exp(-((edge-.85)**2)/.0009);
    }
    case 'medallion':
      r=ellipse(.98,.77); return r>1 ? null : .23+.10*dome(r)+.13*Math.exp(-((r-.84)**2)/.0015);
    case 'bun':
      r=ellipse(.97,.85); return r>1 ? null : .15+.66*dome(r);
    case 'round-ear':
      r=ellipse(.90,.96); return r>1 ? null : .15+.42*dome(r)-.23*Math.exp(-(((r-.27)/.4)**2));
    case 'rabbit-ear': {
      r=ellipse(.45,.98); return r>1 ? null : .15+.48*dome(r)-.21*Math.exp(-((x/.21)**2+(y/.66)**2));
    }
    case 'paw': {
      const pads=[ellipse(.68,.51,0,.36),ellipse(.31,.37,-.58,-.16),ellipse(.34,.43,0,-.46),ellipse(.31,.37,.58,-.16)];
      r=Math.min(...pads);return r>1 ? null : .15+.39*dome(r);
    }
    case 'eye':
      r=ellipse(.85,.97); return r>1 ? null : .18+.60*dome(r);
    case 'muzzle':
      r=ellipse(.96,.64); return r>1 ? null : .16+.44*dome(r);
    case 'star': {
      const a = Math.atan2(y,x)+Math.PI/2;
      const sector = ((a%(Math.PI*.4))+Math.PI*.4)%(Math.PI*.4);
      const theta = Math.min(sector,Math.PI*.4-sector), inner=.47, half=Math.PI/5;
      const radius = inner*Math.sin(half)/(inner*Math.sin(half)*Math.cos(theta)+(1-inner*Math.cos(half))*Math.sin(theta));
      r=Math.hypot(x,y)/radius; return r>1 ? null : .14+.46*(1-r);
    }
    case 'letter': {
      const distanceTo = (ax,ay,bx,by) => {
        const t=Math.max(0,Math.min(1,((x-ax)*(bx-ax)+(y-ay)*(by-ay))/((bx-ax)**2+(by-ay)**2)));
        return Math.hypot(x-ax-(bx-ax)*t,y-ay-(by-ay)*t);
      };
      const d=Math.min(distanceTo(-.63,.83,0,-.80),distanceTo(0,-.80,.63,.83),distanceTo(-.37,.26,.37,.26));
      return d>.135 ? null : .15+.18*dome(d/.135);
    }
    default: return null;
  }
}
const templateReliefs = new Map();
// Verified Hi3D task df97d7cf6a464a28b087994214c7b6b0. Store the compact top
// sample independently from the downloadable 3D mesh. Both use the same source GLB.
function roseToppingGeometry() {
  if (templateReliefs.has('hi-rosette')) return templateReliefs.get('hi-rosette');
  const maskBytes=atob('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH4AAAAAfACA/wAAAAD+AcD/AAAAAP8H8P8BAAAA/x/4/wEAAAD/////AQAAgP////8BAACA/////wMAAID/////AwAAgP////8DAACA/////wMAAID/////BwAAwP////8PAADA/////z8AAMD//////wEA4P//////BwDw//////8fAPz//////x+A////////H+D///////8f+P///////x/4////////H/j///////8P+P///////w/4////////B/j///////8H8P///////wPg////////AcD///////8AwP///////wCA//////9/AAD//////38AAP7/////fwAA/v////9/AAD+//////8AAP7//////wAA/v//////AQD+//////8BAP///////wMA////////AwD///////8DgP///////wOA////////A4D///////8BgP///////wAA//////8/AAD//////wMAAP7///8/AAAA/P///x8AAAAAAP7/DwAAAAAA+P8HAAAAAADw/wMAAAAAAOD/AwAAAAAAwP8BAAAAAACA/wAAAAAAAAB+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
  const values=Array.from(atob('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AAAAAAAAAAAAAAAAAC5IWWZwdXd0bGBQPBgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJ0JTXmZqaGFVQygAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZOklTWFlTRi8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAApOkJEPisAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=='),c=>c.charCodeAt(0));
  const mask=values.map((_,i)=>(maskBytes.charCodeAt(i>>3)>>(i%8))&1);
  const shape={poly:[[0.7611,0.0],[0.7594,0.0498],[0.7266,0.0957],[0.728,0.1448],[0.7533,0.2018],[0.7919,0.2688],[0.8247,0.3416],[0.8174,0.4031],[0.8219,0.4745],[0.7578,0.5064],[0.7007,0.5377],[0.6499,0.57],[0.5714,0.5714],[0.5266,0.6005],[0.4576,0.5963],[0.4228,0.6328],[0.3805,0.6591],[0.3491,0.7079],[0.3164,0.7639],[0.2779,0.8186],[0.2286,0.8531],[0.176,0.8847],[0.1165,0.885],[0.0578,0.8813],[0.0,0.855],[-0.0541,0.8251],[-0.0993,0.7546],[-0.1448,0.728],[-0.1848,0.6898],[-0.2235,0.6584],[-0.2733,0.6597],[-0.3283,0.6657],[-0.3805,0.6591],[-0.4437,0.6641],[-0.5091,0.6634],[-0.5823,0.664],[-0.6644,0.6644],[-0.7206,0.6319],[-0.7603,0.5834],[-0.7891,0.5272],[-0.7893,0.4557],[-0.7584,0.374],[-0.7292,0.302],[-0.7296,0.2477],[-0.7261,0.1945],[-0.728,0.1448],[-0.7546,0.0993],[-0.8251,0.0541],[-0.8174,0.0],[-0.8813,-0.0578],[-0.9129,-0.1202],[-0.9123,-0.1815],[-0.9167,-0.2456],[-0.8363,-0.2839],[-0.7639,-0.3164],[-0.691,-0.3408],[-0.6347,-0.3664],[-0.6016,-0.4019],[-0.5665,-0.4347],[-0.5651,-0.4956],[-0.5382,-0.5382],[-0.539,-0.6146],[-0.532,-0.6933],[-0.5064,-0.7578],[-0.4745,-0.8219],[-0.4197,-0.8511],[-0.3524,-0.8507],[-0.2899,-0.8541],[-0.2116,-0.7896],[-0.1503,-0.7557],[-0.0993,-0.7546],[-0.0473,-0.7219],[-0.0,-0.7235],[0.0473,-0.7219],[0.0993,-0.7546],[0.1576,-0.7925],[0.2286,-0.8531],[0.299,-0.8808],[0.3668,-0.8854],[0.4364,-0.8848],[0.4933,-0.8544],[0.5272,-0.7891],[0.5377,-0.7007],[0.57,-0.6499],[0.5714,-0.5714],[0.6005,-0.5266],[0.6336,-0.4862],[0.6953,-0.4646],[0.7649,-0.4416],[0.8343,-0.4114],[0.9115,-0.3775],[0.9164,-0.3111],[0.9167,-0.2456],[0.8847,-0.176],[0.857,-0.1128],[0.8251,-0.0541]],relief:{n:64,values,mask}};
  templateReliefs.set('hi-rosette',shape);
  return shape;
}
// Rounded icing strokes are stored as 44 × 44 glyph silhouettes, including counters.
const icingGlyphs={"A":"AAAAAAAAAAAAAAAAAPgAAAAAwD8AAAAA/gMAAADgfwAAAAD/BwAAAPD/AAAAgP8PAAAA+P8BAACA/x8AAAD8/QEAAMCfPwAAAP74AwAA4I9/AAAA/vAHAADwB38AAAB/8A8AAPgH/gAAgD/gHwAA+AP8AQDAP8AfAAD8AfwDAMAfgD8AAP4A+AcA4A+AfwAA////BwDw////AAD///8PAPj///8BgP///x8A/AMA/gHAPwDAPwD8AQD8A+AfAIB/AP4BAPgH4A8AgH8A/wAA8AfgBwAAfwB+AADgB8ADAAA8AAAAAAAAAAAAAAAAAAAAAAA=","B":"AAAAAAAAAAAAAAAA//8fAAD4//8PAMD///8BAPz//z8AwP///wcA/P//fwDAPwD8DwD8AwD/AMA/APAPAPwDAP4BwD8A4A8A/AMA/gDAPwDgDwD8AwD/AMA/APgHAPwDwH8AwP///wMA/P//DwDA//9/AAD8//8fAMD///8HAPz///8AwD8A+B8A/AMA/gHAPwDAPwD8AwD8A8A/AMA/APwDAPwDwD8AwD8A/AMA/APAPwDAPwD8AwD+A8A/APgfAPz///8BwP///w8A/P//fwCA////AwD4//8fAAD//z8AAAAAAAAAAAAAAAAAAAAAAAA=","C":"AAAAAAAAAAAAAAAAAPwHAAAA+P8DAADg//8AAAD//x8AAPz//wcA4P//fwAA/g/+DwDwPwD/AYD/AOAfAPgHAPwDwH8AwD8A/AMA+APAPwAAPwD+AQDwAeAfAAAOAP4BAAAA4B8AAAAA/gAAAADgDwAAAAD+AAAAAOAPAAAAAP4AAAAA4A8AAAAA/gEA4ADgHwAAPwD+AQDwA8AfAIA/APwDAPgDwD8AwD8A+AcA/AOA/wDgHwDwH4D/AQD+D/4PAOD//38AAPz//wMAgP//HwAA4P//AAAA+P8DAAAA/AcAAAAAAAAAAAAAAAAAAAAAAAA=","D":"AAAAAAAAAAAAAAAAAAAAAADw/38AAID//x8AAPz//wcAwP///wAA/P//HwDA////AwD8A/h/AMA/APwPAPwDgP8AwD8A8B8A/AMA/gHAPwDgHwD8AwD8A8A/AMA/APwDAPwDwD8AwD8A/AMA/APAPwCAPwD8AwD4A8A/AIA/APwDAPgDwD8AwD8A/AMA/APAPwDAPwD8AwD8A8A/AMA/APwDAP4BwD8A4B8A/AMA/wHAPwD4DwD8A8D/AMA/AP8HAPz//z8AwP///wMA/P//DwDA//9/AAD4//8BAAD//wcAAAAAAAAAAAAAAAAAAAAAAAA=","E":"AAAAAAAAAAAAAAAA/P//DwDg////AQD+//8fAPD///8BAP///x8A8P///wAA/wAAAADwDwAAAAD/AAAAAPAPAAAAAP8AAAAA8A8AAAAA/wAAAADwDwAAAAD/AAAAAPAPAAAAAP///wcA8P//fwAA////DwDw////AAD///8HAPD//z8AAP8AAAAA8A8AAAAA/wAAAADwDwAAAAD/AAAAAPAPAAAAAP8AAAAA8A8AAAAA/wAAAADwDwAAAAD/AAAAAPD///8BAP///z8A8P///wMA/v//PwDg////AQD8//8PAAAAAAAAAAAAAAAAAAAAAAA=","F":"AAAAAAAAAAAAAAAA+P//BwDA////AAD+//8PAOD///8AAP7//w8A4P//fwAA/gEAAADgHwAAAAD+AQAAAOAfAAAAAP4BAAAA4B8AAAAA/gEAAADgHwAAAAD+AQAAAOAfAAAAAP7//wEA4P//HwAA/v//AwDg//8fAAD+//8BAOA/AAAAAP4BAAAA4B8AAAAA/gEAAADgHwAAAAD+AQAAAOAfAAAAAP4BAAAA4B8AAAAA/gEAAADgHwAAAAD+AQAAAOAfAAAAAP4BAAAA4B8AAAAA/gEAAADADwAAAAB4AAAAAAAAAAAAAAAAAAAAAAAAAAA=","G":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/A8AAAD8/wcAAPD//wAAgP//PwAA/P//BwDg//H/AAD/AfgPAPgPAP8BgH8A4B8A/AMA/AHAHwCAHwD+AQD4AOAPAAAAAP4AAAAA4A8AAAAA/gAAAADwDwAAAAD/APD/APAPwP8fAP8A/P8D4A/A/z8A/gD4/wPgDwCAPwD+AADwA+AfAAA/APwBAPADwD8AAD8A+AcA8AOA/wCAPwDwHwD/AwD+H/8/AMD///8BAPj//w8AAP//PwAAwP9/AAAA4P8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=","H":"AAAAAAAAAAAAAAAAAAAAAADwAAB4AIAfAMAPAPwBAPwBwB8AwB8A/AMA/AHAPwDAHwD8AwD8AcA/AMAfAPwDAPwBwD8AwB8A/AMA/AHAPwDAHwD8AwD8AcA/AMAfAPwDAPwBwP///x8A/P///wHA////HwD8////AcD///8fAPz///8BwD8AwB8A/AMA/AHAPwDAHwD8AwD8AcA/AMAfAPwDAPwBwD8AwB8A/AMA/AHAPwDAHwD8AwD8AcA/AMAfAPwDAPwBwD8AwB8A/AEA/AHAHwDAHwD4AQD8AAAPAIAHAAAAAAAAAAAAAAAAAAAAAAA=","I":"AAAAAAAAAAAAAAAAAPAAAAAAgB8AAAAA+AMAAADAPwAAAAD8AwAAAMA/AAAAAPwDAAAAwD8AAAAA/AMAAADAPwAAAAD8AwAAAMA/AAAAAPwDAAAAwD8AAAAA/AMAAADAPwAAAAD8AwAAAMA/AAAAAPwDAAAAwD8AAAAA/AMAAADAPwAAAAD8AwAAAMA/AAAAAPwDAAAAwD8AAAAA/AMAAADAPwAAAAD8AwAAAMA/AAAAAPwDAAAAwD8AAAAA/AMAAADAPwAAAAD8AwAAAMA/AAAAAPgBAAAAgB8AAAAA8AAAAAAAAAAAAAAAAAAAAAAAAAA=","J":"AAAAAAAAAAAAAAAAAAB4AAAAAMAPAAAAAPwBAAAA4B8AAAAA/gEAAADgHwAAAAD+AQAAAOAfAAAAAP4BAAAA4B8AAAAA/gEAAADgHwAAAAD+AQAAAOAfAAAAAP4BAAAA4B8AAAAA/gEAAADgHwAAAAD+AQAAAOAfAAAAAP4BAAAA4B8AAAAA/gEAgADgHwAAPgD+AQDwB+AfAAB/AP4BAPAH4B8AAH8A/gEA8A/gHwAA/wD/AADgH/APAAD+w/8AAMD//wcAAPz/PwAAgP//AwAA8P8fAAAA/n8AAAAA/wEAAAAAAAAAAAAAAAAAAAAAAAA=","K":"AAAAAAAAAAAAAAAADwCABwD4AQD+AMAfAPAPAPwDAP8AwD8A+A8A/APAfwDAPwD+BwD8A/A/AMA/gP8BAPwD/A8AwD/gPwAA/AP/AQDAP/gPAAD8w38AAMA//gMAAPzzHwAAwL//AwAA/P9/AADA//8HAAD8//8AAMD//x8AAPx//gEAwP/jPwAA/B/8BwDA/4D/AAD8B/gPAMA/AP8BAPwD8D8AwD8A/gMA/APAfwDAPwD8DwD8A4D/AMA/APAfAPwDAP8DwD8A4D8A/AMA/APAHwDAPwD4AQD4AwAPAAAfAAAAAAAAAAAAAAAAAAAAAAA=","L":"AAAAAAAAAAAAAAAAeAAAAADADwAAAAD+AQAAAOAfAAAAAP4BAAAA4B8AAAAA/gEAAADgHwAAAAD+AQAAAOAfAAAAAP4BAAAA4B8AAAAA/gEAAADgHwAAAAD+AQAAAOAfAAAAAP4BAAAA4B8AAAAA/gEAAADgHwAAAAD+AQAAAOAfAAAAAP4BAAAA4B8AAAAA/gEAAADgHwAAAAD+AQAAAOAfAAAAAP4BAAAA4B8AAAAA/gEAAADgHwAAAAD+/38AAOD///8AAP7//x8A4P///wEA/v//HwDA////AAD4//8HAAAAAAAAAAAAAAAAAAAAAAA=","M":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgHAP8AwP8A+B8A/g+A/wPg/wD4PwD+H8D/A+D/Afw/AP4fwP8D4P8B/D8A/j/g/wPg/wP+PwD+PuD3A+DvBz4/AP5+8PMD4O8HPz8A/n7w+wPgzw+fPwD+/Pj5A+DPj58/AP78+PED4I/fDz8A/vj98APgj98PPwD++P/wA+AP/wc/AP7wf/AD4A//Bz8A/uB/8APgD/4DPwD+4D/wA+AP/gM/AP7AP/AD4Af8AT8AfIAf8AGAA/AADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=","N":"AAAAAAAAAAAAAAAAAAAAAADwAQBwAIA/AIAPAPgDAPwBwH8AwB8A/A8A/AHA/wDAHwD8HwD8AcD/A8AfAPw/APwBwP8HwB8A/P8A/AHA/w/AHwD8/wH8AcDfP8AfAPz5A/wBwJ9/wB8A/PEP/AHAH/7AHwD84R/8AcAf/MMfAPyBP/wBwB/4xx8A/AH//AHAH/DPHwD8Af79AcAfwP8fAPwB/P8BwB+A/x8A/AHw/wHAHwD/HwD8AeD/AcAfAPwfAPwBwP8BwB8A+B8A/AEA/wHAHwDwHwD4AAD+AAAHAIAHAAAAAAAAAAAAAAAAAAAAAAA=","O":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/gMAAAD8/wEAAPD/fwAAwP//HwAA/v//AwDw//9/AID/AfwPAPgPgP8AwH8A8B8A/AMA/gHgHwDAPwD+AQD8A+APAIA/AP4AAPgD8A8AgH8A/wAA+AfwDwAAfwB/AADwB/AHAAB/AP8AAPAH8A8AgH8A/wAA+AfgDwCAPwD+AAD4A+AfAMA/AP4BAPwDwD8A4B8A/AcA/wGA/wD4DwD4H8D/AAD///8HAOD//z8AAPz//wEAAP//BwAAwP8fAAAA4H8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=","P":"AAAAAAAAAAAAAAAA/P8fAADg//8PAAD+//8DAPD//38AAP///w8A8P///wAA/wD4HwDwDwD/AQD/AOAfAPAPAP4BAP8AwD8A8A8A/AMA/wDAPwDwDwD+AQD/AOAfAPAPAP8BAP8A+B8A8B/8/wAA////DwDw//9/AAD///8DAPD//w8AAP//PwAA8B8AAAAA/wAAAADwDwAAAAD/AAAAAPAPAAAAAP8AAAAA8A8AAAAA/wAAAADwDwAAAAD/AAAAAPAPAAAAAP8AAAAA8A8AAAAA/gAAAADgBwAAAAA8AAAAAAAAAAAAAAAAAAAAAAAAAAA=","Q":"AAAAAAAAAAAAAAAAAP4DAAAA/P8BAADw/38AAMD//x8AAP7//wMA8P//fwCA/wH8DwD4D4D/AMB/APAfAPwDAP4B4B8AwD8A/gEA/APgDwCAPwD+AAD4A/APAIB/AP8AAPgH8A8AAH8AfwAA8AfwBwAAfwD/AADwB/APAIB/AP8AAPgH4A8AgD8A/gAA+APgH/DAPwD+gT/8A8A/8O8fAPwH/v8BgP+A/w8A+B/g/wAA////BwDg//9/AAD8//8PAAD///8DAOD///8AAPB/8B8AAAAA/gEAAACADwAAAABgAAAAAAAAAAAAAAAAAAAAAAA=","R":"AAAAAAAAAAAAAAAA//8/AAD4//8PAMD///8DAPz//38AwP///w8A/P///wDAPwD4HwD8AwD/AcA/AOA/APwDAPwDwD8AwD8A/AMA/APAPwDAPwD8AwD+AcA/APAfAPwDgP8BwP///w8A/P//fwDA////AwD8//8PAMD//z8AAPz//wEAwD/wPwAA/AP8BwDAP4D/AAD8A/AfAMA/AP8DAPwD4D8AwD8A/AcA/APA/wDAPwD4DwD8AwD/AcA/APAfAPwDAP4DwD8A4D8A/AMA/AOAPwCAPwD4AQD4AwAPAAAeAAAAAAAAAAAAAAAAAAAAAAA=","S":"AAAAAAAAAAAAAAAAAP4DAAAA/P8BAADw/38AAID//w8AAPz//wEA4P//PwAA/wH+AwDwD8B/AAB/APgHAPAHAH8AAH8A8AcA8AcAPgAA/wDAAQDwHwAAAAD/DwAAAOD/DwAAAP7/BwAAwP//AwAA8P//AAAA/v8fAAAA//8DAACA/38AAACA/w8AAADA/wAAAAD4DwDwAAD/AIAfAOAfAPgDAP4BgD8A4A8A+AMA/gCAfwDwDwDwD4D/AAD/AfwHAOD//38AAPz//wMAgP//HwAA8P9/AAAA/P8DAAAA/gcAAAAAAAAAAAAAAAAAAAAAAAA=","T":"AAAAAAAAAAAAAACA////HwD8////A8D///8/AP7///8HwP///z8A/P///wMA/P//AwAAwD8AAAAA/AMAAADAPwAAAAD8AwAAAMA/AAAAAPwDAAAAwD8AAAAA/AMAAADAPwAAAAD8AwAAAMA/AAAAAPwDAAAAwD8AAAAA/AMAAADAPwAAAAD8AwAAAMA/AAAAAPwDAAAAwD8AAAAA/AMAAADAPwAAAAD8AwAAAMA/AAAAAPwDAAAAwD8AAAAA/AMAAADAPwAAAAD8AwAAAMA/AAAAAPwDAAAAgB8AAAAA8AAAAAAAAAAAAAAAAAAAAAAAAAA=","U":"AAAAAAAAAAAAAAAAAAAAAADwAAB4AIAfAMAPAPwBAPwBwB8AwB8A/AMA/AHAPwDAHwD8AwD8AcA/AMAfAPwDAPwBwD8AwB8A/AMA/AHAPwDAHwD8AwD8AcA/AMAfAPwDAPwBwD8AwB8A/AMA/AHAPwDAHwD8AwD8AcA/AMAfAPwDAPwBwD8AwB8A/AMA/AHAPwDAHwD8AwD8AcA/AOAfAPwDAP4BgD8A4B8A+AcA/gCAfwDwDwD4D4D/AAD/A/4HAPD//38AAP7//wMAwP//HwAA+P//AAAA/v8DAAAA/wcAAAAAAAAAAAAAAAAAAAAAAAA=","V":"AAAAAAAAAAAAAACABwAAHgD8AADwA8AfAIA/APwBAPgDwB8AgD8A/AMA/APAPwDAPwD4AwD8AYB/AOAfAPgHAP4AAH8A4A8A8A8A/wAA/wDwBwDgDwB/AAD+AfgHAMAfgD8AAPwB+AMAwD/APwAA+AP8AQCAP8AfAAD4B/4AAAB/4A8AAPAH/gAAAP/wBwAA4A9/AAAA/vAHAADAnz8AAAD8+QMAAMCfPwAAAPj/AQAAgP8fAAAA+P8AAAAA/w8AAADw/wAAAAD/BwAAAOB/AAAAAP4DAAAAwD8AAAAA+AAAAAAAAAAAAAAAAAAAAAAAAAA=","W":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAD4AHCAD8AfgA/4APwB+IAfwB/AD/gB/gP8gB/gP8AP+AH+A/wAH/B/wAfwA/8HfgA/8H3gB/AD3wd+AD74+eAD4IePDz8Afvj48APgh48PPwB8fPDxAcDPBx8fAPx88PkBwM8Hnx8A+D7g+wCA7wO+DwD4P+D/AID/A/4PAPAfwH8AAP8B/AcA8B/AfwAA/wD4BwDgD4A/AAD+APgDAOAHAD8AADwA4AEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=","X":"AAAAAAAAAAAAAAAAHACABwDgAwD8AAB/AOAPAPAPAP4AAP8A8A8A4B+AfwAA/gP4BwDAP8A/AAD4B/4DAIB/4B8AAPAP/wAAAP/5DwAA4J9/AAAA/P8DAADA/z8AAAD4/wEAAAD/DwAAAPD/AAAAAP4HAAAA4H8AAAAA/w8AAAD4/wAAAID/HwAAAPz/AwAA4P8/AAAA/vkHAADwn/8AAID/8A8AAPgH/wEAwH/gPwAA/gP8AwDwH8B/AAD/AfgPAPgPAP8AgH8A8B8A+AcA/gGAPwDAHwD4AQD8AAAPAIAHAAAAAAAAAAAAAAAAAAAAAAA=","Y":"AAAAAAAAAAAAAAAADwAABwD4AAD4AMAfAMAfAPwDAP4BwD8A4B8A+AcA/wCA/wD4DwDwD4B/AAD+AfwDAOA/4D8AAPwD/gEAgH/wDwAA+Af/AAAA//gHAADw3z8AAAD+/wMAAMD/HwAAAPz/AAAAgP8PAAAA8H8AAAAA/wMAAADgPwAAAAD+AQAAAMAfAAAAAPwBAAAAwB8AAAAA/AEAAADAHwAAAAD8AQAAAMAfAAAAAPwBAAAAwB8AAAAA/AEAAADAHwAAAAD8AQAAAMAfAAAAAPwBAAAAwA8AAAAAeAAAAAAAAAAAAAAAAAAAAAAAAAA=","Z":"AAAAAAAAAAAAAAAA////AwD4////AMD///8PAPz///8AgP///w8A8P///wAAAAD8DwAAAMB/AAAAAP4HAAAA8D8AAACA/wEAAAD8DwAAAMB/AAAAAP4HAAAA8D8AAACA/wEAAAD8DwAAAOB/AAAAAP4DAAAA8D8AAACA/wEAAAD8DwAAAOB/AAAAAP4DAAAA8B8AAACA/wEAAAD8DwAAAOB/AAAAAP8DAAAA8B8AAACA/wAAAAD8DwAAAOB/AAAAAP7///8A8P///z8A/////wPg////PwD+////A4D///8fAAAAAAAAAAAAAAAAAAAAAAA="};
function icingGlyphGeometry(char){
  const key='icing-'+char;
  if(templateReliefs.has(key))return templateReliefs.get(key);
  const n=44,bytes=atob(icingGlyphs[char]);
  const mask=Array.from({length:n*n},(_,i)=>(bytes.charCodeAt(i>>3)>>(i%8))&1);
  const values=mask.map((set,i)=>{
    if(!set)return 0;
    const x=i%n,y=Math.floor(i/n);let edge=6;
    for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){
      if(!mask[(y+dy)*n+x+dx])edge=Math.min(edge,Math.hypot(dx,dy));
    }
    return Math.round(16+55*Math.min(1,edge/4));
  });
  const poly=[];
  for(let i=0;i<80;i++){
    const a=i*Math.PI/40;
    for(let step=116;step>0;step--){
      const x=Math.cos(a)*step/100,y=Math.sin(a)*step/100;
      const ix=Math.round((x+1)*(n-1)/2),iy=Math.round((y+1)*(n-1)/2);
      if(ix>=0&&iy>=0&&ix<n&&iy<n&&mask[iy*n+ix]){poly.push([x,y]);break}
    }
  }
  const shape={poly,relief:{n,values,mask}};templateReliefs.set(key,shape);return shape;
}
// Intersect the decoration silhouette with each grid triangle to keep thin
// stems, ring interiors and the edges of piped shapes smooth at any angle.
const detailedFoodSurfaces = new Set([
  'strawberry-half','cherry','raspberry','peach','fig','pepper-ring','corn','mushroom',
  'olive','mint','cocoa-shell','pink-ribbon','sugar-heart','sugar-daisy','sugar-moon','sugar-star'
]);
function meshFoodContour(surface, count, add, tri, quad) {
  const samples = [], cuts = new Map();
  function point(x, y) {
    return {x, y, z: templateHeight(surface,x,y), index: -1};
  }
  function vertex(p) {
    if (p.index < 0) p.index = add(p.x,p.y,p.z,(p.x+1)/2,(p.y+1)/2);
    return p.index;
  }
  function boundary(i,j) {
    const key = Math.min(i,j)*count*count+Math.max(i,j);
    if (cuts.has(key)) return cuts.get(key);
    let inside = samples[i], outside = samples[j];
    if (inside.z === null) [inside,outside] = [outside,inside];
    for (let step=0; step<10; step++) {
      const mid = point((inside.x+outside.x)/2,(inside.y+outside.y)/2);
      if (mid.z === null) outside = mid;
      else inside = mid;
    }
    cuts.set(key,inside);
    return inside;
  }
  function wall(a,b) {
    const uv = p => [(1+p.x)/2,(1+p.y)/2];
    const topA = add(a.x,a.y,a.z,...uv(a)), topB = add(b.x,b.y,b.z,...uv(b));
    const lowA = add(a.x,a.y,0,...uv(a)), lowB = add(b.x,b.y,0,...uv(b));
    quad(lowA,lowB,topB,topA,true);
  }
  function face(i,j,k) {
    const ids = [i,j,k];
    const kept = ids.filter(id=>samples[id].z !== null).length;
    if (!kept) return;
    if (kept === 3) {
      tri(...ids.map(id=>vertex(samples[id])));
      return;
    }
    const outline = [], edges = [];
    for (let v=0; v<3; v++) {
      const cur=ids[v], next=ids[(v+1)%3];
      const curInside=samples[cur].z !== null, nextInside=samples[next].z !== null;
      if (curInside) outline.push(samples[cur]);
      if (curInside !== nextInside) {
        const p = boundary(cur,next);
        outline.push(p);
        edges[curInside ? 0 : 1] = p;
      }
    }
    for (let t=1; t<outline.length-1; t++) tri(vertex(outline[0]),vertex(outline[t]),vertex(outline[t+1]));
    wall(edges[0],edges[1]);
  }
  for (let y=0; y<count; y++) for (let x=0; x<count; x++) {
    samples.push(point(x*2.06/(count-1)-1.03,y*2.06/(count-1)-1.03));
  }
  for (let y=0; y<count-1; y++) for (let x=0; x<count-1; x++) {
    const i=y*count+x;
    face(i,i+1,i+count+1);
    face(i,i+count+1,i+count);
  }
}
function templateGeometry(surface) {
  if (surface.startsWith('icing-')) return icingGlyphGeometry(surface.slice(6));
  if (surface === 'hi-flower') return featuredFlower;
  if (surface === 'hi-rosette') return roseToppingGeometry();
  if (templateReliefs.has(surface)) return templateReliefs.get(surface);
  const fineDetail=['letter','star','paw','tablet','medallion','cherry','raspberry','pepper-ring','pink-ribbon','sugar-daisy','sugar-star','mint'];
  const n=surface.startsWith('base-') ? 64 : fineDetail.includes(surface) || ['strawberry','onion','broccoli','basil'].includes(surface) ? 44 : 32;
  const mask=[], values=[];
  for(let row=0;row<n;row++){
    for(let column=0;column<n;column++){
      const value=templateHeight(surface,column*2/(n-1)-1,row*2/(n-1)-1);
      mask.push(value===null ? 0 : 1);
      values.push(value===null ? 0 : Math.max(0,Math.min(255,Math.round((value-.12)*255/.82))));
    }
  }
  // The stored polygon supplies the edit bounds; the mesh mask preserves cutouts.
  const points=[];
  for(let i=0;i<80;i++){
    const a=i*2*Math.PI/80;
    for(let step=120;step>0;step--){
      const x=Math.cos(a)*step/100,y=Math.sin(a)*step/100;
      if(templateHeight(surface,x,y)!==null){points.push([x,y]);break}
    }
  }
  const shape={poly:points,relief:{n,mask,values}};
  templateReliefs.set(surface,shape);
  return shape;
}
function makeTemplatePart(asset,x=0,y=0) {
  const item=part(asset.kind,x,y,asset.size);
  item.templateKey=asset.key;
  item.color=asset.color;
  if(asset.surface && (foodLibrary.includes(asset)||Object.values(foodBases).includes(asset)))item.foodSurface=asset.surface;
  if(asset.sourceModel)item.sourceModel=asset.sourceModel;
  if(asset.surface){
    const geometry=templateGeometry(asset.surface);
    item.poly=geometry.poly;
    item.relief=geometry.relief;
  }
  return item;
}
function makeTemplateStarter(id) {
  return [{...makeTemplatePart(workshopTemplates[id].base),fixedBase:true}];
}
function foodPartHeight(piece,u=0,v=0){
  if(piece.foodSurface?.startsWith('base-')){
    return piece.s*(templateHeight(piece.foodSurface,u,v)||0);
  }
  if(piece.relief){
    const {n,mask,values}=piece.relief;
    const ix=Math.round((u+1)*(n-1)/2),iy=Math.round((v+1)*(n-1)/2);
    if(ix<0||iy<0||ix>=n||iy>=n)return 0;
    const i=iy*n+ix;
    return (mask ? mask[i] : values[i]) ? piece.s*(.12+values[i]*.82/255)*(piece.relief.depthScale??1) : 0;
  }
  const radius=Math.hypot(u,v),style=pastrySpecs[piece.kind]?.[4];
  if(radius>1)return 0;
  return style ? piece.s*1.15*pastryHeight(style,radius,Math.atan2(v,u)) : .72;
}
function templateContactHeight(lower,upper) {
  const dx=(upper.x-lower.x)/lower.s,dy=(upper.y-lower.y)/lower.s;
  const a=lower.angle||0,x=dx*Math.cos(a)+dy*Math.sin(a),y=dy*Math.cos(a)-dx*Math.sin(a);
  return foodPartHeight(lower,x,y);
}
// Spread click-added toppings over the usable face; preserve deliberate pointer drops.
function templatePlacement(id,asset,pieces,drop) {
  const base=pieces.find(p=>p.fixedBase);
  if(!base)return drop||{x:0,y:0};
  const radius=base.s, usable=Math.max(.06,radius*.90-Math.min(.30,asset.size||.20)*.66);
  if(drop){
    const dx=drop.x-base.x,dy=drop.y-base.y,dist=Math.hypot(dx,dy);
    const ratio=dist>usable ? usable/dist : 1;
    return {x:base.x+dx*ratio,y:base.y+dy*ratio};
  }
  const slots=Array.from({length:12},(_,i)=>{
    const angle=(i%6)*Math.PI/3+(i>=6?.4:0)-Math.PI/2,r=(i<6?.70:.37)*usable;
    return {x:base.x+Math.cos(angle)*r,y:base.y+Math.sin(angle)*r};
  });
  slots.unshift({x:base.x,y:base.y});
  const toppings=pieces.filter(p=>p!==base);
  const clearance=s=>Math.min(...toppings.map(p=>Math.hypot(p.x-s.x,p.y-s.y)-p.s*.48));
  return slots.reduce((best,s)=>clearance(s)>clearance(best)?s:best);
}
