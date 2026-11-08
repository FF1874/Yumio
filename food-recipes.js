// Coordinates are in the same world units as workshop pieces. The base is added by the workshop.
function recipePiece(key, x, y, scale, rotation = 0) {
  return {key, x, y, scale, rotation};
}
function studioRecipe(id, theme, name, parts) {
  return {id, theme, name, cover: 'assets/recipes/' + id + '.webp', parts};
}
const studioRecipes = [
  studioRecipe('cake-strawberry-mango', 'cake', '草莓芒果奶油蛋糕', [
    recipePiece('strawberry', -.43, -.22, .32, -.70),
    recipePiece('strawberry', -.19, -.38, .29, -.38),
    recipePiece('strawberry-half', .06, -.43, .25, .30),
    recipePiece('mango', .38, -.24, .215, .13),
    recipePiece('mango', .54, -.04, .19, -.22),
    recipePiece('mango', .30, .09, .18, .42),
    recipePiece('blueberry', .43, .30, .11),
    recipePiece('blueberry', -.55, .09, .10),
    recipePiece('mint', -.61, -.14, .16, -.72),
    recipePiece('vanilla-flute', -.44, .36, .17, .02),
    recipePiece('vanilla-flute', -.19, .52, .17, .20),
    recipePiece('vanilla-flute', .10, .54, .16, -.35)
  ]),
  studioRecipe('cake-rose-berry', 'cake', '玫瑰莓果蛋糕', [
    recipePiece('rosette', -.29, -.30, .33, -.22),
    recipePiece('rosette', .27, -.29, .24, .61),
    recipePiece('rosette', -.51, .10, .20, .20),
    recipePiece('raspberry', .49, -.10, .18, .88),
    recipePiece('raspberry', -.25, .35, .16, -.60),
    recipePiece('cherry', -.02, -.55, .17, .18),
    recipePiece('cherry', -.46, .47, .16, -.34),
    recipePiece('blueberry', -.60, -.34, .085),
    recipePiece('blueberry', .31, -.57, .085),
    recipePiece('mint', -.59, -.13, .18, -1.08),
    recipePiece('mint', .52, -.37, .18, .92),
    recipePiece('sugar-daisy', .15, .39, .13, .15)
  ]),
  studioRecipe('pizza-tomato-basil', 'pizza', '番茄罗勒披萨', [
    recipePiece('tomato', -.48, -.34, .26, -.53),
    recipePiece('tomato', .18, -.51, .255, .23),
    recipePiece('tomato', .51, -.01, .25, .65),
    recipePiece('tomato', .22, .47, .245, -.63),
    recipePiece('tomato', -.43, .32, .26, .32),
    recipePiece('onion', -.04, -.10, .22, -.24),
    recipePiece('basil', -.15, -.01, .23, -.86),
    recipePiece('basil', .12, .12, .21, .68),
    recipePiece('basil', -.50, -.53, .15, -.48),
    recipePiece('basil', .36, .37, .15, .52),
    recipePiece('olive', -.58, -.03, .11),
    recipePiece('olive', .03, .55, .095)
  ]),
  studioRecipe('pizza-pepper-mushroom', 'pizza', '彩椒蘑菇披萨', [
    recipePiece('pepper-ring', -.36, -.46, .24, -.29),
    recipePiece('pepper-ring', .21, .39, .25, .37),
    recipePiece('pepper-ring', .49, -.23, .23, .43),
    recipePiece('mushroom', .09, -.39, .22, .66),
    recipePiece('mushroom', -.51, -.05, .20, -.49),
    recipePiece('mushroom', .46, .21, .20, .22),
    recipePiece('onion', -.25, .37, .23, .44),
    recipePiece('olive', .07, -.06, .11, .42),
    recipePiece('olive', -.47, .47, .11, -.60),
    recipePiece('basil', -.16, .04, .19, -.92),
    recipePiece('corn', -.31, -.19, .13, -.21),
    recipePiece('corn', .36, -.52, .14, .52)
  ]),
  studioRecipe('cookie-citrus-wreath', 'cookie', '柑橘花环饼干', [
    ...Array.from({length: 8}, (_, i) => {
      const angle = Math.PI * i / 4;
      return recipePiece(i % 2 ? 'vanilla-flute' : 'orange',
        .52 * Math.cos(angle), .52 * Math.sin(angle), i % 2 ? .14 : .22, angle + Math.PI / 2);
    }),
    recipePiece('sugar-daisy', -.04, .015, .205, .28),
    recipePiece('blueberry', -.26, -.54, .07),
    recipePiece('blueberry', .28, .53, .075),
    recipePiece('mint', -.55, .25, .11, -1.02)
  ]),
  studioRecipe('cookie-cocoa-letters', 'cookie', '可可字母印花饼干', [
    recipePiece('icing-H', -.19, .04, .25, -.06),
    recipePiece('icing-I', .19, .04, .25, .06),
    recipePiece('cocoa-shell', -.43, -.39, .17, -.63),
    recipePiece('cocoa-shell', .37, .42, .17, .62),
    recipePiece('sugar-star', .30, -.42, .14, .18),
    recipePiece('sugar-star', -.36, .44, .11, -.51),
    recipePiece('blueberry', -.12, -.50, .075),
    recipePiece('blueberry', .11, .50, .07)
  ])
];
