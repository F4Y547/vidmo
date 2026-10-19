import { getAudience } from './audiences.js';
import { COMPLEXITY_RANGES } from './dishes/index.js';

const COMPLEX_SIGNALS = [
  /biryani/i,
  /nihari/i,
  /samosa/i,
  /jalebi/i,
  /tandoor/i,
  /\bdum\b/i,
  /layer/i,
  /stuff/i,
  /ferment/i,
  /braise/i,
  /pastry/i,
  /roast/i,
  /lasagna/i,
  /ramen/i,
  /sushi/i,
  /croissant/i,
  /baklava/i,
  /haleem/i,
  /paya/i,
  /korma/i,
  /risotto/i,
  /paella/i,
  /ravioli/i,
  /tiramisu/i,
];

const MEDIUM_SIGNALS = [
  /curry/i,
  /karahi/i,
  /kabab/i,
  /kebab/i,
  /grill/i,
  /fry/i,
  /bake/i,
  /burger/i,
  /steak/i,
  /wing/i,
  /sauce/i,
  /dough/i,
  /noodle/i,
  /pasta/i,
  /pulao/i,
  /chicken/i,
  /fish/i,
  /lamb/i,
  /mutton/i,
  /beef/i,
  /paneer/i,
  /taco/i,
  /pizza/i,
  /soup/i,
  /stew/i,
  /cutlet/i,
  /pakora/i,
];

const SIMPLE_SIGNALS =
  /salad|sandwich|toast|omelette|omelet|smoothie|tea|coffee|popcorn|maggi|instant|pakora|fries|cheese toast/i;

const CATEGORY_PATTERNS = [
  ['dessert', /jalebi|gulab|pancake|waffle|cake|donut|doughnut|dessert|sweet|pudding|kheer|halwa|brownie|pie|tart|tiramisu|baklava/i],
  ['rice', /biryani|pulao|rice|chawal|risotto|paella|pilaf/i],
  ['noodle', /pasta|noodle|ramen|chow\s*mein|spaghetti|macaroni|lasagna|linguine|fettuccine/i],
  ['dough', /samosa|dumpling|momo|empanada|bread|naan|paratha|pizza|pie|pastry|taco|wonton|spring roll/i],
  ['protein', /chicken|fish|steak|lamb|mutton|beef|prawn|shrimp|egg|wings|kabab|kebab|salmon|turkey|paneer|tofu/i],
  ['vegetable', /pakora|fries|vegetable|salad|mushroom|potato|okra|brinjal|spinach|gobi|cauliflower|bhindi/i],
];

const CATEGORY_EMOJI = {
  dessert: '🍯',
  rice: '🍛',
  noodle: '🍜',
  dough: '🥟',
  protein: '🍗',
  vegetable: '🥦',
  general: '🍽️',
};

const SEQUENCES = {
  protein: {
    simple: ['prep', 'season', 'sear', 'rest', 'hero'],
    medium: ['prep', 'marinate', 'season', 'sear', 'baste', 'rest', 'hero'],
    complex: ['prep', 'marinate', 'toastSpices', 'sear', 'sauce', 'simmer', 'reduce', 'rest', 'hero'],
  },
  rice: {
    simple: ['rinse', 'bloom', 'simmer', 'steam', 'hero'],
    medium: ['rinse', 'marinate', 'bloom', 'sear', 'layer', 'steam', 'hero'],
    complex: ['rinse', 'marinate', 'fryOnions', 'bloom', 'sear', 'layer', 'dum', 'rest', 'hero'],
  },
  dough: {
    simple: ['mixDough', 'restDough', 'shape', 'fry', 'hero'],
    medium: ['mixDough', 'restDough', 'filling', 'roll', 'fillSeal', 'fry', 'hero'],
    complex: ['mixDough', 'restDough', 'filling', 'spiceToss', 'roll', 'foldCone', 'fillSeal', 'fry', 'hero'],
  },
  noodle: {
    simple: ['boil', 'sauce', 'toss', 'plate', 'hero'],
    medium: ['prep', 'boil', 'sauce', 'sear', 'toss', 'plate', 'hero'],
    complex: ['prep', 'marinate', 'boil', 'sauce', 'sear', 'toss', 'reduce', 'plate', 'hero'],
  },
  vegetable: {
    simple: ['prep', 'batter', 'fry', 'hero'],
    medium: ['prep', 'batter', 'heatOil', 'fry', 'drain', 'hero'],
    complex: ['prep', 'spiceToss', 'batter', 'heatOil', 'fry', 'drain', 'chutney', 'hero'],
  },
  dessert: {
    simple: ['mixDough', 'shape', 'heatFat', 'hero'],
    medium: ['mixDough', 'restDough', 'heatFat', 'shape', 'cookSweet', 'hero'],
    complex: ['mixDough', 'restDough', 'syrup', 'heatFat', 'shape', 'cookSweet', 'soak', 'hero'],
  },
  general: {
    simple: ['prep', 'season', 'cook', 'hero'],
    medium: ['prep', 'marinate', 'cook', 'sauce', 'build', 'hero'],
    complex: ['prep', 'marinate', 'toastSpices', 'cook', 'sauce', 'reduce', 'garnish', 'hero'],
  },
};

function beat(name, visual, hand, motion, state, next, focus, sfx, options = {}) {
  return {
    name,
    visual,
    hand,
    motion,
    state,
    next,
    focus,
    camera: options.camera ?? 'slow macro push-in',
    sfx,
    duration: options.duration ?? 5,
    ingredients: options.ingredients ?? '{ingredientsText}',
    ...(options.final ? { final: true } : {}),
  };
}

const BEATS = {
  prep: beat(
    'Prep the {dish}',
    'The tiny ingredients for {dish} are arranged across a small board: {ingredientsText}, each portioned into miniature bowls, with the {main} at the center.',
    'Giant fingers move between the bowls, pinching ingredients and placing them with precision, making the tiny food look even smaller.',
    'The fingers lift the {main}, turn it once and set it beside the prepared bowls; a faint dust of {seasoning} settles as the camera drifts across the board.',
    'prepared ingredients for {dish} portioned on a miniature board',
    'the {main} moving into its first seasoning step',
    'the giant fingertips, tiny ingredient piles and board texture',
    ['ingredients settling', 'tiny bowl taps', 'distant outdoor ambience'],
    { duration: 5 },
  ),
  season: beat(
    'Season the {main}',
    'A pinch of {seasoning} falls from giant fingertips onto the {main}; the grains catch the light and settle into every crease.',
    'Giant fingers press the seasoning into the {main}, turning it until the surface is evenly coated.',
    'The fingers lift and turn the {main}; seasoning falls, the surface glistens, and the camera pushes in on the crust forming.',
    'seasoned {main} on a tiny board',
    'the {main} sliding into the hot {cookware}',
    'the seasoning crust, giant fingertip ridges and tiny ingredient dust',
    ['seasoning sprinkle', 'fingertip press', 'soft board tap'],
    { duration: 4, ingredients: '{main}, {seasoning}' },
  ),
  marinate: beat(
    'Marinate the {main}',
    'The {main} rests in a tiny bowl of {marinade}, with {seasoning} and chopped aromatics clinging to the surface.',
    'Giant fingers massage the marinade into the {main}, turning it until every side is coated.',
    'The {main} turns through the marinade; the mixture folds, spice flecks spread and a drip falls back into the bowl.',
    'marinated {main} in a miniature bowl',
    'the {main} ready for the hot {cookware}',
    'the marinade coating, spice flecks and giant fingertips',
    ['wet marinade fold', 'ingredient turn', 'tiny bowl scrape'],
    { duration: 5 },
  ),
  batter: beat(
    'Coat in Batter',
    'The {main} is folded into a thick batter in a tiny bowl; the golden coating climbs through every piece.',
    'Giant fingers turn the {main} through the batter until each piece is fully coated.',
    'The pieces turn; batter clings, a thick strand drips back into the bowl, and the camera orbits the coating.',
    '{main} coated in thick golden batter',
    'the first piece being lowered into the hot oil',
    'the thick batter coating and dripping strand',
    ['thick batter fold', 'slow drip', 'tiny bowl scrape'],
    { duration: 5, ingredients: '{main}, batter, {seasoning}' },
  ),
  toastSpices: beat(
    'Toast the Whole Spices',
    'Whole spices toast in a tiny dry pan; their oils darken the seeds and a fragrant haze lifts into the light.',
    'Giant fingers shake the pan, then tip the toasted spices into a small bowl.',
    'The pan tilts; seeds tumble, a wisp of smoke rises, and the camera follows the spice dust down into the bowl.',
    'toasted whole spices in a miniature pan',
    'the toasted spices being added to the {dish}',
    'the dark toasted seeds, oil sheen and spice dust',
    ['whole spices crackling', 'dry pan shake', 'spice pour'],
    { duration: 4, ingredients: 'whole spices, {ingredientsText}' },
  ),
  sear: beat(
    'Sear the {main}',
    'The {main} hits the hot {cookware}; a golden crust forms instantly and a plume of steam rises past the lens.',
    'Giant fingers lay the {main} into the pan and press it flat for a beat with a tiny spatula.',
    'The {main} sears; fat bubbles, the crust deepens, and the camera glides along the caramelized surface.',
    'seared {main} with a deep golden crust',
    'the {main} moving toward the next stage',
    'the caramelized crust and bubbling fat at the edge',
    ['loud sear', 'fat sizzle', 'spatula tap', 'steam hiss'],
    { duration: 6, camera: 'low macro push-in along the pan', ingredients: '{main}, cooking oil, {seasoning}' },
  ),
  grill: beat(
    'Grill the {main}',
    'The {main} lies across the grates of a miniature grill; orange embers glow beneath and dark grill marks begin to form.',
    'Giant fingers turn the {main} with tiny tongs, then press it gently into the grate.',
    'The {main} rotates; flames lick at the edges, smoke rolls through the grates, and the camera stays low in the heat.',
    'grilled {main} with char marks over glowing coals',
    'the {main} moving inside to finish cooking',
    'the charred grate marks, embers and curling smoke',
    ['grill sizzle', 'charcoal crackle', 'flame flare', 'tongs tap'],
    { duration: 6, camera: 'low-angle macro through the grill bars', ingredients: '{main}, {seasoning}, cooking oil' },
  ),
  baste: beat(
    'Baste with {fat}',
    'Foaming {fat} is spooned over the {main}; the surface glistens and a fine steam lifts from the pan.',
    'Giant fingers tilt the pan with one hand and spoon the foaming {fat} over the {main} with the other.',
    'The {fat} foams and bubbles; the spoon pours in glossy waves, and the camera orbits the glistening {main}.',
    '{main} basting in foaming {fat}',
    'the {main} resting before the final plate',
    'the golden foam, glossy crust and steam',
    ['{fat} foam', 'spoon basting', 'pan sizzle'],
    { duration: 5, camera: 'tight macro orbit around the pan', ingredients: '{main}, {fat}, {seasoning}' },
  ),
  sauce: beat(
    'Build the Sauce',
    'A glossy {sauce} simmers in a tiny pan; bubbles break across the surface and steam curls around the rim.',
    'Giant fingers stir the sauce with a small spoon, then tilt the pan to check the consistency.',
    'The spoon circles; the sauce thickens and coats the back of the spoon, and the camera pushes in on the glossy surface.',
    'glossy {sauce} simmering in a tiny pan',
    'the sauce being combined with the {main}',
    'the glossy sauce, tiny bubbles and spoon coating',
    ['sauce simmer', 'spoon stir', 'bubble break'],
    { duration: 5, ingredients: '{sauce}, {ingredientsText}' },
  ),
  simmer: beat(
    'Slow Simmer',
    'The {dish} bubbles gently in the {cookware}; steam curls from the surface and the sauce deepens in color.',
    'Giant fingers stir the {dish} slowly, then rest the spoon against the rim.',
    'The spoon turns once; bubbles rise, steam thickens, and the camera drifts through the haze across the surface.',
    '{dish} simmering gently in the {cookware}',
    'the finished simmer moving toward its garnish',
    'the slow bubbles, deep color and steam',
    ['gentle simmer', 'ladle stir', 'steam release'],
    { duration: 6, camera: 'low macro drift through steam', ingredients: '{ingredientsText}' },
  ),
  reduce: beat(
    'Reduce to a Gloss',
    'The sauce reduces in the pan; its surface turns glossy and a rich edge begins to caramelize against the metal.',
    'Giant fingers drag a spoon through the sauce, leaving a clean trail that slowly closes.',
    'The spoon leaves a trail; the sauce closes behind it, bubbles slow, and the camera follows the gloss.',
    'reduced glossy sauce clinging to the pan',
    'the sauce being spooned over the {main}',
    'the clean spoon trail, deep gloss and caramelized edge',
    ['slow bubble', 'spoon scrape', 'steam release'],
    { duration: 5, ingredients: '{sauce}, {seasoning}' },
  ),
  rest: beat(
    'Rest & Settle',
    'The cooked {main} rests on a tiny rack; steam rises and juices pool at the edge of the board.',
    'Giant fingers lift the {main} gently and set it down, then press the surface to check the spring.',
    'The {main} settles; steam slows, a bead of juice runs, and the camera orbits the resting dish.',
    'rested {main} on a tiny rack with juices pooling',
    'the {main} being sliced or plated',
    'the resting crust, rising steam and running juices',
    ['steam release', 'rack settle', 'juices releasing'],
    { duration: 4, ingredients: '{main}, {seasoning}' },
  ),
  rinse: beat(
    'Rinse the Grains',
    'Grains for {dish} cloud a tiny bowl of water; the water turns milky as the starch releases.',
    'Giant fingers swirl the grains, lift a handful and let it fall back with a soft patter.',
    'The grains swirl; water clouds, a handful is lifted and released, and the camera pushes in on the moving grains.',
    'rinsed grains in a clay bowl of cloudy water',
    'the grains going into the {cookware}',
    'the grains, water ripples and giant fingertips',
    ['grains in water', 'water patter', 'bowl tap'],
    { duration: 4, ingredients: '{main}, water' },
  ),
  bloom: beat(
    'Bloom the Spices',
    'Whole spices bloom in hot {fat} inside the {cookware}; the seeds sizzle and release a warm, fragrant haze.',
    'Giant fingers drop the spices in one by one, then stir them through the {fat}.',
    'The spices hit the {fat}; they sizzle, spin and darken, and the camera pushes in on the popping seeds.',
    'whole spices blooming in hot {fat}',
    'the main ingredients being added to the {cookware}',
    'the popping seeds, golden {fat} and spice haze',
    ['whole spices crackle', '{fat} melt', 'spoon tap'],
    { duration: 5, ingredients: 'whole spices, {fat}' },
  ),
  boil: beat(
    'Boil Until Tender',
    'The {main} bubbles in a miniature pot; steam rises and the water rolls in lazy circles around the ingredients.',
    'Giant fingers stir the pot with a small spoon and test a piece between thumb and forefinger.',
    'The spoon circles; bubbles roll, steam lifts, and the camera follows the movement through the haze.',
    'the {main} boiling until tender in a miniature pot',
    'the cooked {main} being drained or combined',
    'the rolling bubbles, steam and ingredient texture',
    ['rolling boil', 'spoon stir', 'steam release'],
    { duration: 5 },
  ),
  steam: beat(
    'Steam & Fluff',
    'A tiny lid lifts from the {cookware}; a cloud of steam reveals fluffy, separate grains glistening with {fat}.',
    'Giant fingers lift the lid and fluff the grains with a small fork, letting the steam curl around the hand.',
    'The lid rises; steam pours out, the fork turns the grains, and the camera follows the haze into the pot.',
    'steamed grains fluffed in the {cookware}',
    'the grains being layered or plated',
    'the separate grains, ghee sheen and steam',
    ['lid lift', 'steam release', 'fork fluff'],
    { duration: 4, ingredients: '{main}, {fat}' },
  ),
  layer: beat(
    'Layer the Dish',
    'Inside the {cookware}, layers of {ingredientsText} are built in a careful pattern; {fat} and garnish wait in tiny bowls.',
    'Giant fingers scatter garnish and spoon {fat} over each layer, smoothing the top with the back of a spoon.',
    'Layer by layer the dish is built; garnish falls, {fat} is drizzled, and the camera pulls back to reveal the full pot.',
    'layered {dish} in the {cookware}, ready for the final cook',
    'the lid going on for the final steam',
    'the layered colors, glossy {fat} and scattered garnish',
    ['ingredient layers', 'spoon spread', 'garnish scatter'],
    { duration: 6, camera: 'slow overhead pull-back', ingredients: '{ingredientsText}, {fat}' },
  ),
  dum: beat(
    'Seal for Dum',
    'A rope of soft dough is pressed around the rim of the {cookware}; the lid goes on and the seal is pinched shut.',
    'Giant fingers press the dough against the rim, sealing every gap, then pat the lid once.',
    'The dough rope is laid and pressed; the lid settles, the seal closes, and the camera circles the rim.',
    'sealed {cookware} with a dough rope, steam building inside',
    'the seal being broken to reveal the finished dish',
    'the dough seal, clay or metal texture and giant fingerprints',
    ['dough pressed', 'lid settle', 'soft pat'],
    { duration: 5, camera: 'slow macro orbit around the sealed rim', ingredients: 'dough seal, {dish}' },
  ),
  fryOnions: beat(
    'Fry the Onions',
    'Thin onion slices fry in a small pan; they turn from pale to deep amber, edges curling and crackling.',
    'Giant fingers stir the onions with a small spider, then lift a golden handful to drain.',
    'The onions sizzle and shrink; the spider lifts a crisp tangle, oil drips, and the camera follows the amber color.',
    'crisp golden fried onions lifted from the pan',
    'the fried onions being scattered between layers',
    'the amber onion strands and shimmering {fat}',
    ['onions frying', '{fat} crackle', 'spider tap'],
    { duration: 5, ingredients: 'onions, {fat}' },
  ),
  mixDough: beat(
    'Mix the Dough',
    'Flour and water come together in a tiny bowl; the mixture turns from shaggy crumbs into a soft, supple dough.',
    'Giant fingers knead the dough against the bowl, folding and pressing until it turns silky.',
    'The dough is folded and pressed; it smooths out, a thumb leaves a soft indent, and the camera orbits the bowl.',
    'smooth {dish} dough resting in a bowl',
    'the dough resting before shaping',
    'the silky dough, flour flecks and giant fingertips',
    ['dough knead', 'bowl scrape', 'flour dust'],
    { duration: 5, ingredients: 'flour, water, {seasoning}' },
  ),
  restDough: beat(
    'Rest the Dough',
    'The dough rests under a small cloth; the surface relaxes and a faint dusting of flour sits on the board.',
    'Giant fingers lift the cloth, press the dough once and cover it again.',
    'The cloth lifts; the dough gives under a fingertip, then the cloth settles and the camera drifts across the board.',
    'rested dough under a cloth on a floured board',
    'the dough being rolled and shaped',
    'the soft dough, cloth weave and flour dust',
    ['cloth settle', 'dough press', 'soft ambient'],
    { duration: 3, ingredients: 'dough, flour' },
  ),
  filling: beat(
    'Cook the Filling',
    'A tiny pan of {ingredientsText} cooks down into a thick, glossy filling; steam carries the spice aroma upward.',
    'Giant fingers stir the filling with a small spoon, then press a piece against the pan to check the texture.',
    'The spoon circles; the filling thickens, bubbles slow, and the camera pushes in on the glossy texture.',
    'thick spiced filling cooling in a tiny pan',
    'the filling being spooned into the dough',
    'the glossy filling, spice flecks and steam',
    ['filling sizzle', 'spoon stir', 'steam release'],
    { duration: 5 },
  ),
  spiceToss: beat(
    'Toast the Filling Spices',
    'Spices hit the hot filling; they sizzle, darken and release a fragrant smoke that curls around the spoon.',
    'Giant fingers toss the spices through the filling, then lower the heat with a tiny gesture.',
    'The spices hit; the mixture jumps in the pan, smoke rises, and the camera follows the toss.',
    'spiced filling sizzling in a tiny pan',
    'the filling cooling before it is shaped',
    'the spice bloom, glossy filling and smoke',
    ['spices crackle', 'filling toss', 'pan tap'],
    { duration: 4 },
  ),
  roll: beat(
    'Roll & Cut',
    'A tiny rolling pin flattens the dough into a thin oval; flour dusts the board and the edges turn translucent.',
    'Giant fingers roll the pin forward, then guide a small knife through the dough in one clean stroke.',
    'The pin rolls; the dough stretches, the knife cuts, and the pieces are lifted and stacked.',
    'thin dough rolled and cut on a floured board',
    'the dough being folded or filled',
    'the translucent dough, clean cut edge and flour dust',
    ['rolling pin', 'dough stretch', 'knife cut', 'flour dust'],
    { duration: 4, camera: 'slow overhead macro glide' },
  ),
  foldCone: beat(
    'Fold the Shape',
    'A piece of dough is folded into a neat hollow cone; a fingertip of paste seals the seam and the pocket stands ready.',
    'Giant fingers pinch the seam, brush it with paste and press it closed.',
    'The dough folds; the seam seals, the pocket opens, and the camera follows the precise fingerwork.',
    'folded dough pocket sealed and ready for filling',
    'the filling being spooned inside',
    'the folded seam, dough layers and giant fingertips',
    ['dough fold', 'paste brush', 'seam press'],
    { duration: 4, camera: 'tight macro profile' },
  ),
  fillSeal: beat(
    'Fill & Seal',
    'The filling is spooned into the dough; the edge is brushed with paste and pinched into a crisp, full shape.',
    'Giant fingers spoon in the filling, press it down, then seal the edge with a neat pinch.',
    'Filling drops into the pocket; the edge is brushed, pinched and crimped, and the finished piece is set on the board.',
    'filled and sealed {dish} on the board',
    'the pieces being lowered into the hot oil',
    'the full pocket, crimped edge and filling',
    ['filling spoon', 'paste brush', 'crimp press', 'board tap'],
    { duration: 5 },
  ),
  fry: beat(
    'Fry Until Golden',
    'The {dish} hits hot oil in the {cookware}; a golden bubble ring blooms and the surface crisps to deep amber.',
    'Giant fingers lower the pieces with tongs, then turn them so every side colors evenly.',
    'The pieces settle; oil bubbles, the crust darkens, and the camera pushes through the steam.',
    '{dish} frying golden in hot oil',
    'the pieces draining on a tiny rack',
    'the bubbling crust, oil and deep golden color',
    ['loud frying', 'oil bubbles', 'tongs tap', 'steam hiss'],
    { duration: 6, camera: 'low macro push-in through steam' },
  ),
  heatOil: beat(
    'Heat the Oil',
    'Oil shimmers in the {cookware}; its surface trembles and a faint heat haze rises above the rim.',
    'Giant fingers drop a small crumb into the oil and watch it sizzle and spin.',
    'The crumb hits; it bubbles and rises, and the camera racks from the crumb to the shimmering oil.',
    'hot shimmering oil ready for frying',
    'the first piece being lowered in',
    'the sizzling crumb and trembling oil surface',
    ['oil shimmer', 'crumb sizzle', 'soft heat hiss'],
    { duration: 4, camera: 'low macro slide along the rim', ingredients: 'cooking oil' },
  ),
  drain: beat(
    'Drain & Crackle',
    'The golden {dish} rests on a tiny rack; oil glistens on the crust and a final scatter of {seasoning} waits nearby.',
    'Giant fingers lift one piece, tap it once to release excess oil and set it back with a crisp crackle.',
    'The piece is tapped; oil flecks fall, the crust crackles, and the camera pushes in on the crisp surface.',
    'fried {dish} draining on a tiny rack',
    'the dish being plated with garnish',
    'the crisp golden crust and oil droplets',
    ['crisp crackle', 'oil drip', 'rack settle'],
    { duration: 4 },
  ),
  shape: beat(
    'Shape the {main}',
    'The {main} is pressed and shaped on a tiny board; giant fingers create clean edges and a thumbprint dimple.',
    'Giant fingers pat the {main} flat, press in a garnish and smooth the edge.',
    'The shape is formed; a thumb leaves a dimple, garnish is pressed in, and the camera follows the fingerwork.',
    'shaped {main} on a tiny board',
    'the {main} moving into the {cookware}',
    'the shaped surface, thumbprint and garnish',
    ['mixture press', 'shape pat', 'board tap'],
    { duration: 4 },
  ),
  heatFat: beat(
    'Heat the {fat}',
    'Golden {fat} shimmers in the {cookware}; its surface ripples and a soft heat haze rises.',
    'Giant fingers hold a tiny thermometer in the {fat}, then lift it away.',
    'The thermometer dips; the {fat} ripples, heat haze rises, and the camera glides along the golden surface.',
    'hot {fat} shimmering in the {cookware}',
    'the batter or shaped pieces going in',
    'the golden {fat}, fine ripples and heat haze',
    ['{fat} shimmer', 'thermometer tap', 'soft heat hiss'],
    { duration: 4, camera: 'low macro slide along the rim', ingredients: '{fat}' },
  ),
  cookSweet: beat(
    'Cook Until Golden',
    'The {dish} cooks in shimmering {fat}; the edges turn golden and a sweet steam rises around it.',
    'Giant fingers turn the {dish} with small tongs, then lift it to check the color.',
    'The pieces turn; {fat} bubbles, the surface crisps, and the camera orbits the golden edges.',
    '{dish} cooking golden in shimmering {fat}',
    'the finished pieces being lifted to drain or soak',
    'the golden edges, bubbles and sweet steam',
    ['sweet frying', 'oil bubbles', 'tongs tap'],
    { duration: 5 },
  ),
  soak: beat(
    'Syrup Soak',
    'The golden {dish} is lowered into a tiny bowl of warm syrup; it hisses softly and absorbs the glossy liquid.',
    'Giant fingers hold the {dish} under the syrup for a beat, then lift it, letting a glossy strand drip back.',
    'The piece sinks; syrup bubbles at the edges, the surface turns glossy, and the camera follows the drip.',
    'syrup-soaked {dish}, glossy and golden',
    'the {dish} being lifted onto the serving plate',
    'the amber syrup, glossy surface and sticky drip',
    ['syrup dip', 'soft hiss', 'sticky drip'],
    { duration: 5, ingredients: '{dish}, syrup' },
  ),
  syrup: beat(
    'Simmer the Syrup',
    'Sugar, water and cardamom simmer into a glossy syrup; bubbles climb the sides of the tiny pan.',
    'Giant fingers stir the syrup, then lift the spoon to watch a slow amber ribbon fall.',
    'The spoon lifts; syrup stretches, bubbles rise, and the camera follows the ribbon back into the pan.',
    'glossy cardamom syrup simmering in a tiny pan',
    'the fried pieces being dipped into the syrup',
    'the amber syrup, bubbles and slow ribbon',
    ['syrup simmer', 'spoon stir', 'bubble break'],
    { duration: 4, ingredients: 'sugar, water, cardamom' },
  ),
  toss: beat(
    'Toss in the Sauce',
    'The {main} is tossed through the {sauce}; the glossy coating climbs through every piece and steam escapes.',
    'Giant fingers toss the pan or stir with a spoon, turning the {main} until fully coated.',
    'The pan jerks; the {main} leaps, sauce clings, and the camera follows the glossy coating.',
    '{main} coated in glossy {sauce}',
    'the dish being plated',
    'the glossy sauce, steam and tossing motion',
    ['pan toss', 'sauce cling', 'steam release'],
    { duration: 5 },
  ),
  plate: beat(
    'Plate the Dish',
    'The {dish} is transferred to a tiny serving plate; steam rises and the sauce settles into a glossy pool.',
    'Giant fingers guide the spoon, then tap it once to release the last drop onto the plate.',
    'The dish slides onto the plate; sauce pools, steam lifts, and the camera pulls back to reveal the portion.',
    '{dish} plated on a tiny serving plate',
    'the final garnish being added',
    'the glossy pool, steam and tiny plate',
    ['plate placement', 'spoon slide', 'steam release'],
    { duration: 5, camera: 'slow macro pull-back' },
  ),
  build: beat(
    'Build the Dish',
    'On a tiny board, the {dish} is assembled layer by layer with {ingredientsText}; the stack rises under giant fingers.',
    'Giant fingers place each element with precision, pressing gently so the layers hold.',
    'Layer by layer the dish is built; sauce spreads, garnish settles, and the camera follows the stack upward.',
    'assembled {dish} on a tiny board',
    'the final garnish and hero frame',
    'the layered stack, sauce gloss and giant fingertips',
    ['layer placement', 'sauce spread', 'soft press'],
    { duration: 6, camera: 'slow vertical tilt following the stack' },
  ),
  garnish: beat(
    'Add the Garnish',
    'Fresh {garnish} is placed on the {dish}; the bright color cuts through the rich tones and steam curls around it.',
    'Giant fingers set each leaf with tweezers, then add a final pinch of {seasoning}.',
    'The garnish settles; seasoning falls, steam lifts, and the camera pushes in on the contrast.',
    '{dish} finished with fresh {garnish}',
    'the final hero frame',
    'the bright garnish, seasoning dust and steam',
    ['garnish placement', 'seasoning sprinkle', 'plate tap'],
    { duration: 4 },
  ),
  chutney: beat(
    'Chutney & Crunch',
    'A tiny bowl of {chutney} sits beside the {dish}; the green sauce glistens and a lemon wedge waits at the edge.',
    'Giant fingers dip a corner of the {dish} into the chutney, then set it back on the plate.',
    'The piece dips; chutney clings, lemon is squeezed, and the camera follows the bright green gloss.',
    '{dish} plated with {chutney} and lemon',
    'the final hero frame',
    'the green chutney, crisp crust and lemon',
    ['chutney dip', 'lemon squeeze', 'plate settle'],
    { duration: 5 },
  ),
  skewer: beat(
    'Thread the Skewer',
    'A small iron skewer runs through the {main}; the metal glints and the {main} hangs ready above the heat.',
    'Giant fingers guide the skewer through the {main}, then hold it above the glowing fire.',
    'The skewer pierces the {main}; the piece is lifted, turned once, and lowered toward the heat.',
    '{main} threaded on an iron skewer above the fire',
    'the {main} descending into the heat',
    'the iron skewer, spiced {main} and glowing fire',
    ['skewer pierce', 'metal tap', 'fire roar'],
    { duration: 4, camera: 'slow macro tilt down toward the fire' },
  ),
  char: beat(
    'Char over Fire',
    'The {main} chars over live heat; the edges blister and darken, and smoke curls around the surface.',
    'Giant fingers turn the {main}, inspecting the char and brushing away a loose fleck of spice.',
    'The {main} rotates; smoke rises, the charred skin crackles, and the camera orbits close.',
    '{main} charred and blistered over live fire',
    'the {main} being finished with {fat} and lemon',
    'the charred spots, blistered surface and smoke',
    ['char crackle', 'flame flare', 'smoke drift'],
    { duration: 5, camera: 'slow macro orbit', ingredients: '{main}, {seasoning}' },
  ),
  tarka: beat(
    'Pour the Tarka',
    'Cumin, garlic and red chili sizzle in hot {fat}; the tarka is poured over the {dish} in a golden stream.',
    'Giant fingers tilt the tiny pan, pouring the sizzling tarka over the dish.',
    'The tarka sputters; cumin pops, garlic turns golden, and the hot {fat} hits the dish with a loud sizzle.',
    'sizzling {fat} tarka poured over the {dish}',
    'the final garnish being added',
    'the golden {fat}, popping cumin and red chili',
    ['tarka sizzle', 'cumin popping', 'loud pour'],
    { duration: 5, ingredients: '{fat}, cumin, garlic, red chili, {dish}' },
  ),
  cook: beat(
    'Cook the {dish}',
    'The {dish} cooks in the {cookware}; steam rises and the ingredients settle into a glossy, fragrant mixture.',
    'Giant fingers stir the dish slowly, then press a piece to check doneness.',
    'The spoon circles; steam thickens, the mixture glistens, and the camera drifts through the haze.',
    '{dish} cooking in the {cookware}',
    'the dish being finished with sauce or garnish',
    'the glossy mixture, steam and ingredient texture',
    ['gentle cook', 'spoon stir', 'steam release'],
    { duration: 6, camera: 'low macro drift through steam' },
  ),
  hero: beat(
    'Final Plating',
    'The finished {dish} is a hero on a tiny serving plate: professional garnish, a glossy finish and a beautiful, appetizing composition, with giant human fingers making the final adjustment.',
    'Giant fingers place the last garnish, nudge the plate into perfect balance and withdraw, leaving deep contact shadows.',
    'The final garnish settles; steam curls, the plate is nudged into place, and the camera begins a slow hero orbit.',
    'finished {dish} beautifully plated with professional garnish',
    'the final hero frame, slowly orbiting',
    'the finished dish, glossy garnish and giant fingertips',
    ['plate placement', 'garnish placement', 'soft steam', 'distant outdoor ambience'],
    {
      duration: 6,
      camera: 'slow cinematic hero orbit with a shallow focus falloff',
      final: true,
      ingredients: '{dish}, {garnish}, {seasoning}',
    },
  ),
};

const CAMERA_ROTATION = [
  'slow macro push-in',
  'slow lateral orbit',
  'tight macro profile',
  'slow overhead drift',
  'slow focus rack',
];

function parseIngredients(input) {
  if (Array.isArray(input)) return input.map((item) => String(item).trim()).filter(Boolean);
  if (!input) return [];
  return String(input)
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 24);
}

function detectCategory(text) {
  for (const [category, pattern] of CATEGORY_PATTERNS) {
    if (pattern.test(text)) return category;
  }
  return 'general';
}

function detectComplexity(name, ingredients, category) {
  const text = `${name} ${ingredients.join(' ')}`;
  const complexMatches = COMPLEX_SIGNALS.filter((pattern) => pattern.test(text));
  const mediumMatches = MEDIUM_SIGNALS.filter((pattern) => pattern.test(text));
  let score = 2;
  score += complexMatches.length * 3;
  score += mediumMatches.length;
  if (ingredients.length >= 7) score += 1;
  if (ingredients.length >= 12) score += 1;
  if (name.trim().split(/\s+/).length >= 5) score += 1;
  if (category === 'dessert' && /jalebi|gulab|baklava|tiramisu/i.test(name)) score += 2;

  let complexity = 'simple';
  if (score >= 5) complexity = 'complex';
  else if (score >= 3) complexity = 'medium';

  if (SIMPLE_SIGNALS.test(name) && complexMatches.length === 0 && ingredients.length <= 8) {
    complexity = 'simple';
  }

  const range = COMPLEXITY_RANGES[complexity];
  const reasons = [];
  if (complexMatches.length) {
    reasons.push(
      `technique signal${complexMatches.length > 1 ? 's' : ''}: ${complexMatches
        .slice(0, 3)
        .map((pattern) => pattern.source.replace(/\\b/g, '').replace(/[\\^$.*+?()[\]{}|]/g, ''))
        .join(', ')}`,
    );
  }
  if (mediumMatches.length) {
    reasons.push(`${mediumMatches.length} cooking-technique signal${mediumMatches.length > 1 ? 's' : ''}`);
  }
  if (ingredients.length) reasons.push(`${ingredients.length} ingredient${ingredients.length > 1 ? 's' : ''}`);
  if (!reasons.length) reasons.push('single-technique dish');

  return {
    complexity,
    range,
    score,
    category,
    rationale: `${range.label} · ${reasons.slice(0, 3).join(' · ')}`,
    signals: {
      complex: complexMatches.map((pattern) => pattern.source),
      medium: mediumMatches.map((pattern) => pattern.source),
    },
  };
}

function detectMain(name, ingredients, category) {
  const proteinMatch = name.match(
    /chicken|fish|steak|lamb|mutton|beef|prawn|shrimp|salmon|turkey|paneer|tofu|egg/i,
  );
  if (category === 'protein') {
    return proteinMatch?.[0]?.toLowerCase() ?? ingredients[0] ?? 'protein';
  }
  if (category === 'rice') return 'rice';
  if (category === 'noodle') return 'noodles';
  if (category === 'dough') return 'dough';
  if (category === 'dessert') return 'batter';
  if (category === 'vegetable') return 'vegetables';
  return ingredients[0] ?? proteinMatch?.[0]?.toLowerCase() ?? 'main ingredient';
}

function pickIngredient(ingredients, regex, fallback) {
  return ingredients.find((item) => regex.test(item)) ?? fallback;
}

function chooseCookware(audience, category) {
  if (category === 'rice') {
    return audience.id === 'desi' ? audience.cookware[0] : audience.cookware[3];
  }
  if (category === 'dessert' || category === 'vegetable') {
    return audience.id === 'desi' ? audience.cookware[2] : audience.cookware[2];
  }
  if (category === 'dough') {
    return audience.id === 'desi' ? audience.cookware[1] : audience.cookware[0];
  }
  return audience.cookware[0];
}

function fill(template, context) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = context[key];
    return value === undefined || value === null || value === '' ? '' : String(value);
  });
}

function materializeBeat(template, context) {
  return {
    name: fill(template.name, context),
    visual: fill(template.visual, context),
    hand: fill(template.hand, context),
    motion: fill(template.motion, context),
    state: fill(template.state, context),
    next: fill(template.next, context),
    focus: fill(template.focus, context),
    camera: template.camera,
    sfx: template.sfx.map((sound) => fill(sound, context)),
    duration: template.duration,
    ingredients: fill(template.ingredients, context),
    ...(template.final ? { final: true } : {}),
  };
}

export function analyzeCustomDish({ name, ingredients, audienceId }) {
  const cleanName = String(name ?? '').trim();
  if (!cleanName) throw new Error('A custom dish name is required');
  getAudience(audienceId);
  const parsedIngredients = parseIngredients(ingredients);
  const category = detectCategory(cleanName);
  const analysis = detectComplexity(cleanName, parsedIngredients, category);
  const stages = SEQUENCES[category][analysis.complexity];
  return {
    name: cleanName,
    ingredients: parsedIngredients,
    category,
    complexity: analysis.complexity,
    complexityLabel: analysis.range.label,
    stageCount: stages.length,
    estimatedDuration: stages.length * 5,
    rationale: analysis.rationale,
    score: analysis.score,
  };
}

export function planCustomDish({ name, ingredients, audienceId }) {
  const cleanName = String(name ?? '').trim();
  if (!cleanName) throw new Error('A custom dish name is required');

  const audience = getAudience(audienceId);
  const parsedIngredients = parseIngredients(ingredients);
  const category = detectCategory(cleanName);
  const analysis = detectComplexity(cleanName, parsedIngredients, category);
  const sequence = SEQUENCES[category][analysis.complexity];
  const main = detectMain(cleanName, parsedIngredients, category);
  const seasoning = pickIngredient(
    parsedIngredients,
    /salt|pepper|chili|chilli|cumin|paprika|masala|turmeric|cinnamon|garlic|ginger|herb|spice/i,
    audience.id === 'desi' ? 'salt and garam masala' : 'sea salt and black pepper',
  );
  const garnish = pickIngredient(
    parsedIngredients,
    /coriander|parsley|basil|mint|chive|scallion|lemon|lime/i,
    audience.id === 'desi' ? 'fresh coriander' : 'fresh herbs',
  );
  const sauce = pickIngredient(
    parsedIngredients,
    /sauce|tomato|cream|butter|gravy|yogurt|stock|broth/i,
    audience.id === 'desi' ? 'masala gravy' : 'glossy pan sauce',
  );
  const cookware = chooseCookware(audience, category);
  const context = {
    dish: cleanName,
    main,
    ingredientsText:
      parsedIngredients.length > 0
        ? parsedIngredients.slice(0, 6).join(', ')
        : `the key ingredients for ${cleanName}`,
    seasoning,
    garnish,
    sauce,
    marinade:
      pickIngredient(parsedIngredients, /yogurt|buttermilk|marinade/i, 'spiced marinade') ||
      'spiced marinade',
    fat: audience.id === 'desi' ? 'ghee' : 'butter',
    chutney: audience.id === 'desi' ? 'mint chutney' : 'herb sauce',
    cookware,
  };

  const stages = sequence.map((beatId, index) => {
    const template = BEATS[beatId];
    if (!template) throw new Error(`Unknown custom stage beat: ${beatId}`);
    const stage = materializeBeat(template, context);
    if (!stage.camera || CAMERA_ROTATION.includes(stage.camera)) {
      // Keep author-provided camera moves; this branch only guards against undefined values.
      stage.camera = stage.camera || CAMERA_ROTATION[index % CAMERA_ROTATION.length];
    }
    return stage;
  });

  const last = stages.at(-1);
  if (last) last.final = true;

  const dish = {
    id: `custom-${cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48)}`,
    name: cleanName,
    emoji: CATEGORY_EMOJI[category],
    cuisine: audience.id === 'desi' ? 'Desi custom' : 'Western custom',
    complexity: analysis.complexity,
    tagline: 'A custom miniature film, planned stage by stage.',
    blurb: `An auto-planned ${analysis.range.label.toLowerCase()} production for ${cleanName}, built for ${audience.label}.`,
    keyIngredients:
      parsedIngredients.length > 0
        ? parsedIngredients.slice(0, 4)
        : [main, seasoning, garnish],
    ingredients: parsedIngredients,
    cookware: [cookware],
    palette: audience.palette,
    accent: audience.palette[0],
    tags: ['custom', category],
    custom: true,
    analysis: {
      category,
      score: analysis.score,
      rationale: analysis.rationale,
    },
    stages,
  };

  return {
    dish,
    analysis: {
      category,
      complexity: analysis.complexity,
      complexityLabel: analysis.range.label,
      stageCount: stages.length,
      rationale: analysis.rationale,
      score: analysis.score,
    },
  };
}
