/**
 * Western dish library.
 * Each stage is a production-ready beat: frame description, hand action,
 * motion, continuity state, focus target, camera move, ASMR sounds and length.
 */

export const WESTERN_DISHES = [
  {
    id: 'fish-and-chips',
    name: 'Fish & Chips',
    emoji: '🐟',
    cuisine: 'British',
    complexity: 'medium',
    tagline: 'Crackling batter, malt-vinegar steam, a seaside hero shot.',
    blurb:
      'A tiny cod fillet meets sparkling batter and a wire basket of chips in a golden-hour backyard.',
    keyIngredients: ['cod', 'maris piper potatoes', 'malt vinegar', 'parsley'],
    ingredients: [
      'line-caught cod fillet',
      'maris piper potatoes',
      'self-raising flour',
      'cold sparkling water',
      'malt vinegar',
      'sea salt',
      'cracked black pepper',
      'flat-leaf parsley',
      'lemon wedge',
    ],
    cookware: [
      'miniature cast-iron fryer',
      'tiny wire fry basket',
      'small slate serving board',
      'mini copper batter bowl',
    ],
    palette: ['#e0a458', '#303d4c', '#f2e3c6'],
    accent: '#e0a458',
    tags: ['pub classic', 'fried', 'crispy'],
    stages: [
      {
        name: 'Portion & Pat Dry',
        visual:
          'The tiny cod fillet rests on a flour-dusted teak board, its pearlescent flesh beaded with moisture as a folded linen cloth blots it dry.',
        hand:
          'A giant thumb and forefinger pin the delicate fillet while the other hand dabs it with the cloth, filling the frame with skin texture.',
        motion:
          'The giant fingers lift the fillet, dust both sides through a tiny bowl of seasoned flour and hold it above the board as a fine flour cloud settles.',
        state:
          'raw cod fillet on a flour-dusted board with tiny bowls of flour, salt and pepper at the edge',
        next: 'the floured fillet hovering above a bowl of wet batter',
        focus:
          'pearlescent fish flesh, flour dust and the ridges of the giant fingertips',
        camera: 'slow macro push-in with a slight parallax drift',
        sfx: ['soft cloth patting', 'flour settling', 'distant backyard birds'],
        duration: 5,
        ingredients: 'cod fillet, self-raising flour, sea salt, cracked black pepper',
      },
      {
        name: 'Batter & Lift',
        visual:
          'The floured fillet is lowered into a tiny copper bowl of thick, cold sparkling-water batter, the surface folding into glossy ribbons around it.',
        hand:
          'Giant fingers pinch the tail end of the fillet, lifting it so batter runs back into the bowl in slow, heavy threads.',
        motion:
          'The fillet is drawn up from the batter, allowed to drip once, then carried toward the shimmering oil; a thin batter ribbon stretches and snaps.',
        state:
          'batter-coated cod fillet suspended above the copper batter bowl, excess batter dripping',
        next: 'the coated fillet at the lip of the hot cast-iron fryer',
        focus: 'the glossy batter coating and the drip caught mid-air',
        camera: 'slow rising tilt following the fillet',
        sfx: [
          'thick batter sliding',
          'slow drip into batter',
          'first faint oil shimmer',
        ],
        duration: 5,
        ingredients: 'cold sparkling water, self-raising flour, cod fillet',
      },
      {
        name: 'First Sizzle',
        visual:
          'The coated fillet touches the hot oil in a miniature cast-iron fryer; a golden bubble ring blooms around it and a column of steam curls past the lens.',
        hand:
          'One giant hand steadies the tiny fryer handle with a folded cloth while the other releases the fillet with small tongs.',
        motion:
          'The fillet is released into the oil; bubbles race outward, the batter puffs and turns pale gold, and the camera pushes in through the steam.',
        state:
          'batter-coated cod frying in shimmering oil, bubbles climbing the edges',
        next: 'the fish floating golden and crisp in the fryer',
        focus: 'the bubbling batter crust and oil beading on the surface',
        camera: 'low-angle macro push-in through rising steam',
        sfx: [
          'loud sizzling oil',
          'bubbling batter',
          'tiny tongs releasing',
          'steam hiss',
        ],
        duration: 6,
        ingredients: 'frying oil, battered cod fillet, sea salt',
      },
      {
        name: 'Golden Turn',
        visual:
          'The fish is flipped in the fryer, revealing a deep amber crust, crisp edges and a scatter of salt catching the golden-hour light.',
        hand:
          'Giant fingers work a pair of tiny tongs, turning the fillet with careful pressure so the crust stays intact.',
        motion:
          'The tongs grip, lift and turn the fish; oil ripples, a few crumbs break free and the second side settles into the shimmer with a fresh burst of sizzle.',
        state:
          'golden fish fillet flipped in the fryer, crisp edges and drifting salt',
        next: 'the finished fillet draining on a tiny wire rack',
        focus: 'the crisp amber crust and tiny flakes of salt',
        camera: 'tight macro profile, slow lateral orbit',
        sfx: [
          'crisp sizzle',
          'tongs tapping',
          'oil crackle',
          'salt grains falling',
        ],
        duration: 5,
        ingredients: 'fried cod fillet, sea salt, frying oil',
      },
      {
        name: 'Chips & Sea Salt',
        visual:
          'A tiny wire basket of golden chips is lifted from the fryer, steam rising as flakes of sea salt fall through the light onto the crisp edges.',
        hand:
          'A giant hand tilts the basket while the other pinches sea salt from a tiny wooden bowl and lets it rain down.',
        motion:
          'The basket is shaken once; chips tumble, salt scatters, and the camera racks focus from the giant salting fingers to the crisp potatoes.',
        state:
          'golden chips in a wire basket, sea salt falling, steam curling upward',
        next: 'the fish and chips arranged on the slate board',
        focus: 'crisp potato edges, salt crystals and rising steam',
        camera: 'slow focus rack with a gentle downward drift',
        sfx: [
          'crisp chips tumbling',
          'salt falling',
          'fryer sizzle receding',
          'light breeze',
        ],
        duration: 5,
        ingredients: 'maris piper potatoes, sea salt, frying oil',
      },
      {
        name: 'Vinegar & Garnish',
        visual:
          'On a tiny slate board, the golden fish sits over a nest of chips; a miniature spoon drizzles malt vinegar and tiny parsley leaves wait on a fingertip.',
        hand:
          'Giant fingers hold a tiny spoon above the fish, then use tweezers to place parsley and a lemon wedge at the edge of the board.',
        motion:
          'Vinegar runs off the spoon in a thin sheen, soaking into the crust; the camera follows the droplets as the parsley is set down.',
        state:
          'plated fish and chips with vinegar sheen, parsley and lemon being placed',
        next: 'the finished hero plate with steam and a final lemon squeeze',
        focus: 'the vinegar sheen on the batter and the bright lemon oils',
        camera: 'slow macro glide from spoon to plate',
        sfx: [
          'vinegar drizzle',
          'tiny spoon tap',
          'garnish placement',
          'plate settling',
        ],
        duration: 5,
        ingredients: 'malt vinegar, flat-leaf parsley, lemon wedge, sea salt',
      },
      {
        name: 'Seaside Hero',
        final: true,
        visual:
          'The finished fish and chips is a hero on a tiny slate board: shatteringly crisp amber batter, stacked chips, lemon, parsley and a glossy vinegar sheen, all dwarfed by giant human fingers making a final adjustment.',
        hand:
          'Giant fingers gently nudge the lemon wedge, press one parsley leaf into place and lift away, leaving perfect contact shadows.',
        motion:
          'A final squeeze of lemon sends a fine mist over the fish; the fingers adjust the garnish and withdraw as the camera settles into a slow hero orbit.',
        state:
          'finished fish and chips plated on a slate board, garnished and steaming',
        next: 'the final hero frame, slowly orbiting',
        focus: 'the crisp batter, vinegar gloss, lemon mist and giant fingertips',
        camera: 'slow cinematic orbit around the miniature plate',
        sfx: [
          'lemon squeeze mist',
          'garnish placement',
          'plate placement',
          'distant birds',
          'soft backyard breeze',
        ],
        duration: 6,
        ingredients: 'malt vinegar, lemon, parsley, sea salt, finished fish and chips',
      },
    ],
  },
  {
    id: 'fried-chicken',
    name: 'Buttermilk Fried Chicken',
    emoji: '🍗',
    cuisine: 'Southern American',
    complexity: 'medium',
    tagline: 'A shatter-crisp crust with steam curling from the first bite.',
    blurb:
      'Buttermilk brine, a craggy spiced dredge and a tiny cast-iron fryer turn one chicken thigh into a crunchy hero.',
    keyIngredients: ['chicken thigh', 'buttermilk', 'smoked paprika', 'honey'],
    ingredients: [
      'boneless chicken thigh',
      'buttermilk',
      'all-purpose flour',
      'smoked paprika',
      'garlic powder',
      'cayenne',
      'sea salt',
      'black pepper',
      'honey',
      'dill pickle',
    ],
    cookware: [
      'miniature cast-iron skillet',
      'tiny wire rack',
      'small enamel tray',
      'mini tongs',
    ],
    palette: ['#c97b3d', '#f0d9b5', '#40533f'],
    accent: '#c97b3d',
    tags: ['crispy', 'fried', 'comfort food'],
    stages: [
      {
        name: 'Buttermilk Brine',
        visual:
          'A tiny chicken thigh sinks into a miniature bowl of buttermilk swirled with paprika and cayenne; the liquid coats every crevice of the raw meat.',
        hand:
          'Giant fingers press the chicken under the buttermilk, then lift it just above the surface to let the spiced brine run back in slow ribbons.',
        motion:
          'The thigh is turned once in the brine, pressed gently, then lifted and held while buttermilk drips from the giant fingertips.',
        state:
          'raw chicken thigh coated in spiced buttermilk, resting above a tiny bowl',
        next: 'the wet thigh moving toward the seasoned flour',
        focus: 'the spiced buttermilk coating and the giant fingerprint pressed into it',
        camera: 'slow macro push-in across the bowl rim',
        sfx: [
          'wet buttermilk squelch',
          'liquid dripping',
          'faint backyard wind',
        ],
        duration: 5,
        ingredients: 'chicken thigh, buttermilk, smoked paprika, cayenne',
      },
      {
        name: 'Spice Dredge',
        visual:
          'The buttermilk-coated thigh lands in a shallow bowl of flour, paprika, garlic powder and pepper, the dry mix climbing up the wet surface in craggy clumps.',
        hand:
          'Giant fingers press the flour into the chicken, flip it and squeeze slightly so the coating forms ruffled edges.',
        motion:
          'The chicken is pressed deep into the flour, turned, lifted and shaken once; a fine dust cloud hangs in the light as extra flour falls away.',
        state:
          'chicken thigh in a craggy spiced flour coating, flour dust suspended in the air',
        next: 'the coated thigh going back for a second buttermilk dip',
        focus: 'the ruffled flour crust and dust drifting across the frame',
        camera: 'tight top-down macro, slow rotation',
        sfx: [
          'flour press and scrape',
          'dry crumbs falling',
          'soft shake',
        ],
        duration: 5,
        ingredients: 'all-purpose flour, smoked paprika, garlic powder, black pepper',
      },
      {
        name: 'Double Dip',
        visual:
          'The floured thigh returns to the buttermilk, then back into the flour; the second coat makes a thick, shaggy crust with visible spice flecks.',
        hand:
          'Giant fingers move the chicken between the two tiny bowls, pressing the final flour coat firmly with a broad thumb.',
        motion:
          'A quick buttermilk dip, then a slow press into flour; the fingers lift the chicken and turn it, revealing the double-coated crust from every angle.',
        state:
          'double-dredged chicken thigh with a thick shaggy crust on a tiny rack',
        next: 'the oil reaching temperature in the cast-iron skillet',
        focus: 'the layered, shaggy crust and spice flecks',
        camera: 'macro orbit around the coated thigh',
        sfx: [
          'wet batter contact',
          'dry flour press',
          'tiny rack rattle',
        ],
        duration: 5,
        ingredients: 'buttermilk, seasoned flour, chicken thigh',
      },
      {
        name: 'Oil Ready',
        visual:
          'A shallow pool of oil shimmers in the miniature cast-iron skillet; a tiny thermometer climbs into the golden zone and a single flour crumb bobs and sizzles.',
        hand:
          'A giant hand hovers over the skillet, then drops a pinch of flour that dances across the surface.',
        motion:
          'The flour crumb hits the oil; it sizzles, spirals and settles as the camera racks from the thermometer to the trembling oil surface.',
        state:
          'hot shimmering oil in a cast-iron skillet with a tiny thermometer reading ready',
        next: 'the chicken thigh held at the edge of the oil',
        focus: 'the oil ripples, tiny bubbles and the flour crumb',
        camera: 'low macro slide along the skillet rim',
        sfx: [
          'oil heating shimmer',
          'flour crumb sizzle',
          'tiny thermometer tick',
        ],
        duration: 4,
        ingredients: 'frying oil, flour crumb, chicken thigh',
      },
      {
        name: 'Golden Fry',
        visual:
          'The chicken is lowered skin-side down into the oil; a violent golden bubble ring erupts and the crust immediately deepens to amber.',
        hand:
          'Giant fingers lower the thigh with tiny tongs, then hold the skillet handle steady through a folded cloth.',
        motion:
          'The chicken settles into the oil; bubbles climb the crust, the camera pushes through steam, and the coating turns from pale to deep gold.',
        state:
          'chicken thigh frying skin-side down in shimmering oil, bubbles around the crust',
        next: 'the crisp chicken draining on a wire rack',
        focus: 'the bubbling crust and oil racing through the craggy edges',
        camera: 'slow low-angle push-in through steam',
        sfx: [
          'loud frying sizzle',
          'oil bubbles',
          'tongs releasing',
          'steam hiss',
        ],
        duration: 6,
        ingredients: 'frying oil, double-dredged chicken thigh',
      },
      {
        name: 'Rest & Crunch',
        visual:
          'The golden chicken rests on a tiny wire rack; visible steam escapes the crust in slow ribbons while a glossy bead of honey waits in a small spoon.',
        hand:
          'Giant fingers hover close to the crust, then lift the chicken slightly to show the shatteringly crisp underside.',
        motion:
          'The chicken is turned on the rack, steam lifting; a tiny spoon drizzles honey in a thin amber line that pools on the crust.',
        state:
          'crisp golden chicken on a wire rack, honey drizzling, steam rising',
        next: 'the chicken being transferred to the final serving board',
        focus: 'the crunchy crust texture, honey gloss and steam',
        camera: 'slow macro orbit around the rack',
        sfx: [
          'crust crackle',
          'honey drizzle',
          'tiny spoon tap',
          'steam release',
        ],
        duration: 5,
        ingredients: 'fried chicken thigh, honey',
      },
      {
        name: 'Crunch Hero',
        final: true,
        visual:
          'The buttermilk fried chicken is plated on dark slate with a dill pickle and a honey drizzle; giant fingers make a final adjustment, and the crust looks loud enough to hear.',
        hand:
          'Giant fingers place the pickle beside the chicken, brush one last drop of honey onto the crust and pull back with a tiny crumb on the thumb.',
        motion:
          'The camera holds as the fingers press the pickle into place and withdraw; a final steam ribbon crosses the golden crust in slow motion.',
        state:
          'finished buttermilk fried chicken plated on slate with pickle and honey',
        next: 'the final hero frame',
        focus: 'the shatter-crisp crust, honey sheen and pickle crunch',
        camera: 'slow cinematic orbit, slight push-in on the crust',
        sfx: [
          'pickle placement',
          'honey drip',
          'plate settle',
          'crust crackle',
          'breeze and birds',
        ],
        duration: 6,
        ingredients: 'fried chicken, honey, dill pickle, sea salt',
      },
    ],
  },
  {
    id: 'cheeseburger',
    name: 'Cheeseburger',
    emoji: '🍔',
    cuisine: 'American',
    complexity: 'medium',
    tagline: 'A tiny smash patty, a molten cheese drape and a perfect build.',
    blurb:
      'A miniature smash burger with a lacy crust, melting cheddar and a glossy brioche bun.',
    keyIngredients: ['beef', 'cheddar', 'brioche bun', 'pickles'],
    ingredients: [
      'ground beef',
      'cheddar cheese',
      'brioche bun',
      'butter',
      'dill pickles',
      'white onion',
      'burger sauce',
      'lettuce',
      'tomato',
      'sesame seeds',
    ],
    cookware: [
      'miniature cast-iron griddle',
      'tiny spatula',
      'small wire rack',
      'mini basting brush',
    ],
    palette: ['#d9944a', '#f4d9a6', '#5b7a4e'],
    accent: '#d9944a',
    tags: ['smash burger', 'cheese', 'grill'],
    stages: [
      {
        name: 'Patty Form',
        visual:
          'A tiny loose ball of coarse-ground beef sits on a sheet of parchment; giant fingers press it into a thin, ragged-edged patty.',
        hand:
          'A giant thumb pushes the beef flat while the other hand steadies the parchment, leaving a shallow fingerprint in the raw meat.',
        motion:
          'The fingers press the patty thin, rotate it, and smooth the ragged edge; the camera pushes in on the beef grain and the indent of the thumb.',
        state: 'thin raw smash patty on parchment with a thumbprint in the meat',
        next: 'the patty sliding onto the hot cast-iron griddle',
        focus: 'the coarse beef grain, parchment texture and giant thumbprint',
        camera: 'slow top-down macro push-in',
        sfx: ['raw beef press', 'parchment crinkle', 'faint grill fire'],
        duration: 5,
        ingredients: 'ground beef, sea salt, black pepper',
      },
      {
        name: 'Hard Sear',
        visual:
          'The patty hits the smoking cast-iron griddle; a dark lace crust forms instantly around the edges and a plume of steam and smoke rises.',
        hand:
          'One giant hand presses the patty flat with a tiny spatula while the other holds the griddle steady.',
        motion:
          'The patty is pressed for a beat, then the spatula lifts; sizzling fat bubbles around the lacy edge as the camera glides along the crust.',
        state:
          'smash patty searing on a cast-iron griddle with a dark lace crust',
        next: 'a slice of cheddar about to be laid over the patty',
        focus: 'the lacy beef crust and fat bubbling at the edge',
        camera: 'low macro tracking shot along the griddle',
        sfx: [
          'loud beef sear',
          'fat sizzle',
          'spatula press',
          'smoke hiss',
        ],
        duration: 6,
        ingredients: 'ground beef, sea salt, black pepper, beef fat',
      },
      {
        name: 'Cheese Drape',
        visual:
          'A tiny square of cheddar is laid over the searing patty; it softens, slumps and begins to run down the craggy edges in slow orange ribbons.',
        hand:
          'Giant fingers place the cheese with precision, then hover close as the heat begins to melt it.',
        motion:
          'The cheese settles, melts and drips; the camera racks focus from the fingertip to the glossy molten edge. A tiny lid is placed over the patty for a beat.',
        state:
          'cheese melting over the seared patty, orange drips at the edges',
        next: 'the buttery brioche bun toasting beside the patty',
        focus: 'the molten cheddar and its reflection on the beef',
        camera: 'macro rack focus with a slow lateral drift',
        sfx: [
          'cheese settling',
          'gentle sizzle',
          'tiny lid placement',
          'fat crackle',
        ],
        duration: 5,
        ingredients: 'cheddar cheese, seared beef patty',
      },
      {
        name: 'Toast the Brioche',
        visual:
          'The cut brioche bun is pressed face-down into a pool of butter on the griddle; its crumb turns golden while butter bubbles around the edges.',
        hand:
          'Giant fingers press the bun gently with a tiny spatula, then lift one edge to reveal the toasted surface.',
        motion:
          'The bun is lifted and turned to show the golden toast; butter glistens, a toasted crumb falls, and the camera follows the bun toward the build.',
        state: 'buttered brioche halves toasting golden on the griddle',
        next: 'the burger beginning its final assembly',
        focus: 'the butter-soaked toasted crumb and golden edges',
        camera: 'slow macro tilt from griddle to bun',
        sfx: [
          'butter sizzle',
          'bun press',
          'soft toast scrape',
          'spatula tap',
        ],
        duration: 4,
        ingredients: 'brioche bun, butter',
      },
      {
        name: 'The Build',
        visual:
          'On a tiny wooden board, the bottom bun receives sauce, lettuce, tomato, the lacy patty and a drape of melted cheddar; giant fingers stack each layer.',
        hand:
          'Giant fingers place each element with tweezers or directly, pressing gently so the cheese spills over the patty edge.',
        motion:
          'Layer by layer, the burger rises; sauce spreads, lettuce crinkles and the cheese stretches slightly as the top bun approaches.',
        state:
          'open cheeseburger stacked on a board with cheese overhanging the patty',
        next: 'the top bun descending onto the stack',
        focus: 'the molten cheese, crinkle of lettuce and sauce gloss',
        camera: 'slow vertical tilt following the stack',
        sfx: [
          'sauce spread',
          'lettuce crinkle',
          'cheese settle',
          'soft patty press',
        ],
        duration: 6,
        ingredients: 'burger sauce, lettuce, tomato, pickles, cheddar, beef patty',
      },
      {
        name: 'Sauce & Pickle',
        visual:
          'The top bun is set in place; a tiny spoon drizzles glossy burger sauce over it and a pickle slice is balanced at the edge of the board.',
        hand:
          'Giant fingertips press the top bun gently, then place a sesame seed and a pickle with precision.',
        motion:
          'The bun settles; sauce drips down the side, a sesame seed is placed, and the camera pushes toward the glossy stack.',
        state: 'assembled cheeseburger with sauce dripping and pickle beside it',
        next: 'the final hero stack with a cheese pull',
        focus: 'the sauce drip, sesame seeds and the soft bun',
        camera: 'slow push-in at plate level',
        sfx: [
          'sauce drizzle',
          'bun press',
          'pickle placement',
          'tiny plate tap',
        ],
        duration: 5,
        ingredients: 'burger sauce, sesame seeds, dill pickle, brioche bun',
      },
      {
        name: 'Cheese-Pull Hero',
        final: true,
        visual:
          'The cheeseburger stands as a tiny hero on a slate board: toasted brioche, lacy beef, molten cheddar and a glossy sauce drip, while giant fingers steady it for the final shot.',
        hand:
          'Giant fingers press the top bun, then gently pull it up just enough to reveal a long, molten cheese stretch before settling it back down.',
        motion:
          'The cheese pull stretches and snaps; sauce trembles, steam escapes, and the camera settles into a slow hero orbit as the fingers withdraw.',
        state:
          'finished cheeseburger on slate with a cheese pull, steam and glossy sauce',
        next: 'the final hero frame',
        focus: 'the molten cheese stretch, lacy patty and toasted bun',
        camera: 'slow cinematic orbit with a gentle push-in',
        sfx: [
          'cheese stretch',
          'soft bun press',
          'sauce drip',
          'plate placement',
          'distant backyard birds',
        ],
        duration: 6,
        ingredients: 'finished cheeseburger, cheddar, burger sauce, pickle',
      },
    ],
  },
  {
    id: 'bbq-steak',
    name: 'BBQ Steak',
    emoji: '🥩',
    cuisine: 'American BBQ',
    complexity: 'medium',
    tagline: 'Charred crust, butter baste, a slice that glistens.',
    blurb:
      'A tiny ribeye over live charcoal, basted in herb butter and rested to a perfect blush.',
    keyIngredients: ['ribeye', 'rosemary', 'garlic butter', 'flaky salt'],
    ingredients: [
      'ribeye steak',
      'coarse sea salt',
      'black pepper',
      'rosemary',
      'garlic',
      'unsalted butter',
      'flaky salt',
      'charred spring onion',
    ],
    cookware: [
      'miniature charcoal grill',
      'tiny cast-iron skillet',
      'mini basting spoon',
      'small wooden board',
    ],
    palette: ['#b85c3e', '#e8c18a', '#31443c'],
    accent: '#b85c3e',
    tags: ['grill', 'steak', 'butter'],
    stages: [
      {
        name: 'Dry Brine',
        visual:
          'The tiny ribeye rests on a wooden board, dusted with coarse salt and cracked pepper; its marbled surface catches the low sun.',
        hand:
          'Giant fingers press flaky salt into the steak, turn it, and massage the seasoning into the marbled surface.',
        motion:
          'The steak is flipped and pressed; salt crystals glint, pepper settles, and the camera drifts across the marbling toward the waiting grill.',
        state: 'seasoned raw ribeye on a wooden board, salt and pepper visible',
        next: 'the steak laid over glowing charcoal',
        focus: 'beef marbling, salt crystals and the giant fingertip pressing in',
        camera: 'slow overhead macro glide',
        sfx: ['salt sprinkle', 'raw meat press', 'charcoal crackle'],
        duration: 5,
        ingredients: 'ribeye steak, coarse sea salt, black pepper',
      },
      {
        name: 'Charcoal Sear',
        visual:
          'The ribeye hits the hot grill grates; orange embers glow beneath, and dark grill marks and a smoky crust begin to form.',
        hand:
          'A giant hand turns the steak with tiny tongs; the other shields the flame as sparks lift into the bokeh.',
        motion:
          'The steak is pressed to the grate, then flipped; flames lick at the fat, smoke rolls past the lens and the crust deepens.',
        state: 'ribeye searing over glowing charcoal with grill marks forming',
        next: 'the steak moved into a tiny cast-iron skillet for basting',
        focus: 'the charred crust, live embers and smoke curling through the grates',
        camera: 'low-angle macro through the grill bars',
        sfx: [
          'steak sear',
          'charcoal crackle',
          'flame flare',
          'tongs clink',
        ],
        duration: 6,
        ingredients: 'ribeye steak, charcoal fire, sea salt',
      },
      {
        name: 'Butter Baste',
        visual:
          'In a tiny cast-iron skillet, foaming garlic-rosemary butter laps over the seared steak; the herb sprig blackens at the edges.',
        hand:
          'A giant hand tilts the skillet while the other spoons foaming butter over the steak in quick, glossy waves.',
        motion:
          'Butter foams and bubbles; the spoon lifts and pours, rosemary sizzles, and the camera pushes in on the glossy crust.',
        state:
          'steak basting in foaming garlic-rosemary butter inside a tiny skillet',
        next: 'the steak resting on a board, juices pooling',
        focus: 'golden foaming butter, rosemary needles and the glossy crust',
        camera: 'tight macro orbit around the skillet',
        sfx: [
          'butter foaming',
          'rosemary sizzle',
          'spoon basting',
          'skillet handle tap',
        ],
        duration: 5,
        ingredients: 'unsalted butter, garlic, rosemary, seared ribeye',
      },
      {
        name: 'Rest & Slice',
        visual:
          'The steak rests on a tiny wooden board; a bead of juice runs to the edge as a giant hand slices it with a miniature knife.',
        hand:
          'Giant fingers hold the steak steady while the knife makes slow, clean slices, revealing a rosy center.',
        motion:
          'The knife draws through the crust; juices release, the slice opens like a book, and the camera follows the steam and the blush of the meat.',
        state: 'rested steak partially sliced on a board, rosy interior exposed',
        next: 'the slices fanned across the board with charred spring onion',
        focus: 'the rosy interior, caramelized crust and running juices',
        camera: 'slow macro push-in along the knife line',
        sfx: [
          'knife slicing crust',
          'juices releasing',
          'board contact',
          'soft steam',
        ],
        duration: 6,
        ingredients: 'rested ribeye, flaky salt, rosemary',
      },
      {
        name: 'Board & Char',
        visual:
          'Steak slices are fanned on the board beside blistered spring onion; flaky salt falls and a rosemary sprig rests against the warm meat.',
        hand:
          'Giant fingers arrange the slices, add a charred spring onion and pinch flaky salt over the top.',
        motion:
          'The slices are nudged into a fan, spring onion is placed, salt cascades, and the camera pulls back to reveal the whole board.',
        state: 'sliced steak fanned on a board with charred spring onion and rosemary',
        next: 'the final hero board with butter melting over the slices',
        focus: 'the fanned pink slices, charred onion and falling salt',
        camera: 'slow pull-back macro reveal',
        sfx: [
          'salt falling',
          'slice arrangement',
          'spring onion placement',
          'charcoal crackle in distance',
        ],
        duration: 5,
        ingredients: 'sliced steak, charred spring onion, rosemary, flaky salt',
      },
      {
        name: 'Butter Melt Hero',
        final: true,
        visual:
          'The final steak board is a hero: fanned blush-pink slices, a melting coin of herb butter, charred spring onion and flaky salt, with giant fingers making a last adjustment.',
        hand:
          'Giant fingers set a melting butter coin on the warm steak and nudge a rosemary sprig into place before withdrawing.',
        motion:
          'The butter melts and runs into the slices; steam curls, the rosemary settles, and the camera begins a slow hero orbit.',
        state:
          'finished sliced steak board with melting herb butter and garnish',
        next: 'the final hero frame',
        focus: 'the melting butter, rosy steak and glistening juices',
        camera: 'slow cinematic orbit with a shallow focus falloff',
        sfx: [
          'butter melting',
          'juices sizzle',
          'rosemary placement',
          'board settle',
          'breeze through leaves',
        ],
        duration: 6,
        ingredients: 'sliced steak, herb butter, rosemary, flaky salt',
      },
    ],
  },
  {
    id: 'pancakes',
    name: 'Fluffy Pancakes',
    emoji: '🥞',
    cuisine: 'American breakfast',
    complexity: 'simple',
    tagline: 'A sky-high stack with a slow river of maple syrup.',
    blurb:
      'A tiny pancake stack with blistered golden edges, butter and a slow pour of maple syrup.',
    keyIngredients: ['flour', 'buttermilk', 'maple syrup', 'butter'],
    ingredients: [
      'all-purpose flour',
      'buttermilk',
      'egg',
      'baking powder',
      'sugar',
      'butter',
      'maple syrup',
      'sea salt',
      'blueberries',
    ],
    cookware: [
      'miniature non-stick pancake pan',
      'tiny whisk',
      'small syrup jug',
      'mini stack plate',
    ],
    palette: ['#e7b96e', '#9a5b35', '#f8ead0'],
    accent: '#e7b96e',
    tags: ['breakfast', 'sweet', 'stack'],
    stages: [
      {
        name: 'Whisk the Batter',
        visual:
          'A tiny bowl holds flour, buttermilk and egg; a miniature whisk cuts through the batter, leaving soft ribbons and small bubbles.',
        hand:
          'Giant fingers grip the tiny whisk and fold the batter with a slow wrist motion while the other hand steadies the bowl.',
        motion:
          'The whisk circles through the batter; lumps dissolve, a ribbon lifts and folds back, and the camera pushes in on the glossy surface.',
        state: 'thick pancake batter in a tiny bowl with soft ribbons on the surface',
        next: 'the batter being poured into the hot pan',
        focus: 'the batter ribbon, bubbles and the giant knuckles around the whisk',
        camera: 'slow top-down macro push-in',
        sfx: ['whisk against ceramic', 'wet batter fold', 'soft kitchen ambience'],
        duration: 5,
        ingredients: 'flour, buttermilk, egg, baking powder, sugar, sea salt',
      },
      {
        name: 'Pour the Round',
        visual:
          'A small ladle pours batter into a buttered miniature pan; the circle spreads to a perfect edge and tiny bubbles begin to appear.',
        hand:
          'Giant fingers tip the ladle slowly, then set it down and hover over the pan with a tiny spatula.',
        motion:
          'The batter flows into the pan and spreads; butter sizzles at the edge, bubbles rise, and the camera follows the perfect circle.',
        state: 'pancake cooking in a buttered mini pan, bubbles forming at the edges',
        next: 'the pancake ready for its first flip',
        focus: 'the spreading batter, butter sizzle and first bubbles',
        camera: 'slow macro tilt from ladle to pan',
        sfx: [
          'batter pour',
          'butter sizzle',
          'ladle tap',
          'gentle pan sizzle',
        ],
        duration: 5,
        ingredients: 'pancake batter, butter',
      },
      {
        name: 'Bubble & Flip',
        visual:
          'The pancake surface is covered in popping bubbles and blistered golden edges; a tiny spatula slides underneath.',
        hand:
          'Giant fingers guide the spatula under the pancake, lift it and flip it with a soft, confident motion.',
        motion:
          'The spatula slips under; the pancake lifts, turns in the air and lands with a soft sizzle, revealing a golden underside.',
        state: 'pancake flipped in the pan, golden underside facing up',
        next: 'the stack being built on a tiny plate',
        focus: 'the blistered golden surface and the flip caught mid-air',
        camera: 'slow-motion macro profile',
        sfx: [
          'bubbles popping',
          'spatula slide',
          'pancake flip',
          'soft landing sizzle',
        ],
        duration: 5,
        ingredients: 'cooked pancake, butter',
      },
      {
        name: 'Stack & Butter',
        visual:
          'Three tiny pancakes are stacked on a small plate; a pat of butter sits on top and begins to melt down the golden edges.',
        hand:
          'Giant fingers place the final pancake, center the butter and press a blueberry into the top layer.',
        motion:
          'The stack settles; butter softens and slides, a blueberry is placed, and the camera pulls back to show the wobbling stack.',
        state: 'stack of three pancakes with melting butter and a blueberry on top',
        next: 'the maple syrup pour over the stack',
        focus: 'melting butter, golden edges and the soft bounce of the stack',
        camera: 'slow pull-back from the top of the stack',
        sfx: [
          'pancake placement',
          'butter settling',
          'blueberry placement',
          'plate tap',
        ],
        duration: 5,
        ingredients: 'pancakes, butter, blueberries',
      },
      {
        name: 'Maple Hero',
        final: true,
        visual:
          'The final pancake stack glistens under a slow river of maple syrup; butter melts over the edges and giant fingers tilt the tiny jug for the last drop.',
        hand:
          'Giant fingers tip a miniature syrup jug, then catch a stray drip with a fingertip before withdrawing.',
        motion:
          'Syrup pours in a glossy ribbon, pools around the stack and drips down the sides; the camera settles into a slow hero orbit.',
        state: 'finished pancake stack with maple syrup pouring and butter melting',
        next: 'the final hero frame',
        focus: 'the amber syrup ribbon, melting butter and fluffy crumb',
        camera: 'slow cinematic orbit with a gentle push-in',
        sfx: [
          'syrup pour',
          'butter melt',
          'plate settle',
          'soft breakfast ambience',
        ],
        duration: 6,
        ingredients: 'maple syrup, butter, blueberries, pancakes',
      },
    ],
  },
  {
    id: 'mac-and-cheese',
    name: 'Mac & Cheese',
    emoji: '🧀',
    cuisine: 'American comfort',
    complexity: 'medium',
    tagline: 'A molten cheese pull under a toasted crumb lid.',
    blurb:
      'Tiny elbow pasta folded into a silky cheddar sauce, topped with buttery crumbs and baked until bubbling.',
    keyIngredients: ['elbow pasta', 'cheddar', 'butter', 'breadcrumbs'],
    ingredients: [
      'elbow macaroni',
      'sharp cheddar',
      'gruyère',
      'whole milk',
      'butter',
      'all-purpose flour',
      'panko breadcrumbs',
      'mustard powder',
      'sea salt',
      'chives',
    ],
    cookware: [
      'miniature enameled baking dish',
      'tiny saucepan',
      'mini whisk',
      'small gratin spoon',
    ],
    palette: ['#e4a63c', '#f6e3b4', '#c96a2e'],
    accent: '#e4a63c',
    tags: ['cheese', 'baked', 'comfort'],
    stages: [
      {
        name: 'Boil the Elbows',
        visual:
          'Tiny elbow macaroni tumbling in a small pot of bubbling water; steam rises and a few pasta pieces turn at the surface.',
        hand:
          'Giant fingers stir the pasta with a miniature wooden spoon while the other hand holds the pot handle.',
        motion:
          'The spoon circles through the pasta; water bubbles, macaroni rolls, and a single piece is lifted to check the bend.',
        state: 'elbow macaroni boiling in a tiny pot with steam and bubbles',
        next: 'the cooked pasta being folded into cheese sauce',
        focus: 'the pasta edges, rolling bubbles and rising steam',
        camera: 'slow macro push-in through steam',
        sfx: [
          'rolling boil',
          'pasta stirring',
          'wooden spoon tap',
          'steam release',
        ],
        duration: 5,
        ingredients: 'elbow macaroni, water, sea salt',
      },
      {
        name: 'Silky Cheese Sauce',
        visual:
          'A tiny saucepan holds a glossy cheddar sauce; a whisk lifts a thick ribbon that folds back in slow, molten waves.',
        hand:
          'Giant fingers whisk the sauce while the other hand sprinkles cheddar into the swirl.',
        motion:
          'Cheese melts into the béchamel; the whisk creates a glossy vortex, and a ribbon is lifted to show the sauce coating the back of the spoon.',
        state: 'glossy cheddar cheese sauce in a tiny saucepan with a ribbon lifted',
        next: 'the cooked pasta being folded in',
        focus: 'the molten cheese ribbon and tiny bubbles in the sauce',
        camera: 'tight macro orbit around the saucepan',
        sfx: [
          'sauce whisking',
          'cheese melting',
          'gentle simmer',
          'tiny spoon tap',
        ],
        duration: 5,
        ingredients: 'sharp cheddar, gruyère, whole milk, butter, flour, mustard powder',
      },
      {
        name: 'The Fold',
        visual:
          'Cooked macaroni is folded into the cheese sauce; each elbow disappears under the glossy blanket as steam escapes.',
        hand:
          'Giant fingers use a tiny spatula to fold the pasta through the sauce, then press it down gently.',
        motion:
          'The pasta folds into the sauce; cheese climbs through the elbows, steam rises, and the mixture is turned once more.',
        state: 'cheesy macaroni folded together in the saucepan, steam rising',
        next: 'the mac and cheese spooned into a tiny baking dish',
        focus: 'cheese filling the pasta tubes and the glossy fold',
        camera: 'slow macro tilt from pan to dish',
        sfx: [
          'thick fold',
          'cheese squelch',
          'steam release',
          'spatula scrape',
        ],
        duration: 5,
        ingredients: 'cooked macaroni, cheese sauce, butter',
      },
      {
        name: 'Crumb Lid',
        visual:
          'The tiny baking dish is filled with mac and cheese and topped with buttery panko; a pinch of chives lands on the pale crumbs.',
        hand:
          'Giant fingers sprinkle panko across the top, then add chives and a tiny cube of butter.',
        motion:
          'Crumbs cascade over the surface; butter is placed, chives fall, and the camera pulls back to show the unbaked dish.',
        state: 'mac and cheese in a tiny baking dish topped with panko, chives and butter',
        next: 'the dish going into the miniature oven',
        focus: 'the buttery crumb texture and bright chives',
        camera: 'slow overhead push-in',
        sfx: [
          'breadcrumbs falling',
          'chive snip',
          'butter placement',
          'dish settle',
        ],
        duration: 5,
        ingredients: 'panko breadcrumbs, butter, chives',
      },
      {
        name: 'Baked Bubbles',
        visual:
          'Inside the miniature oven, the crumb top turns deep gold while cheese bubbles up around the edges of the dish.',
        hand:
          'A giant hand opens the tiny oven door; heat haze shimmers and the dish is slid out onto a wooden board.',
        motion:
          'The oven door opens with a warm glow; bubbles break at the edge, the dish is pulled forward, and the camera racks through the rising heat.',
        state: 'baked mac and cheese with a golden crumb top and bubbling cheese edges',
        next: 'the first spoonful being lifted from the dish',
        focus: 'the golden crumbs, bubbling cheese and oven glow',
        camera: 'macro through the oven door, slow pull-out',
        sfx: [
          'oven door creak',
          'cheese bubbling',
          'dish sliding',
          'heat shimmer',
        ],
        duration: 5,
        ingredients: 'baked mac and cheese, golden panko crust',
      },
      {
        name: 'Cheese-Pull Hero',
        final: true,
        visual:
          'A tiny spoon lifts a portion of mac and cheese from the dish, stretching a long molten cheese pull; giant fingers steady the dish and adjust a chive garnish.',
        hand:
          'Giant fingers lift the spoon slowly, letting the cheese stretch, then place a final chive on the golden crust.',
        motion:
          'The spoon rises; cheese stretches into a glossy strand, steam escapes, and the camera settles into a hero orbit as the fingers withdraw.',
        state: 'finished baked mac and cheese with a molten cheese pull and chive garnish',
        next: 'the final hero frame',
        focus: 'the stretchy cheese, golden crumb and steam',
        camera: 'slow cinematic orbit with a focus pull to the cheese strand',
        sfx: [
          'cheese stretch',
          'spoon lift',
          'steam release',
          'dish settle',
          'soft outdoor ambience',
        ],
        duration: 6,
        ingredients: 'baked mac and cheese, chives, molten cheddar',
      },
    ],
  },
  {
    id: 'hot-dogs',
    name: 'Hot Dogs',
    emoji: '🌭',
    cuisine: 'American street food',
    complexity: 'simple',
    tagline: 'A snap-cased dog, toasted bun, mustard zigzag.',
    blurb:
      'A tiny grilled hot dog in a buttery toasted bun with a bright mustard zigzag and crispy onions.',
    keyIngredients: ['hot dog', 'brioche bun', 'mustard', 'crispy onions'],
    ingredients: [
      'all-beef hot dog',
      'brioche bun',
      'yellow mustard',
      'crispy onions',
      'dill pickle',
      'butter',
      'ketchup',
      'chives',
    ],
    cookware: [
      'miniature grill grate',
      'tiny tongs',
      'small bun warmer',
      'mini condiment bottles',
    ],
    palette: ['#d1683f', '#e9bd63', '#6f8a4f'],
    accent: '#d1683f',
    tags: ['street food', 'grill', 'quick'],
    stages: [
      {
        name: 'Butter the Bun',
        visual:
          'A tiny brioche bun is split open; a miniature brush paints melted butter across the cut sides, leaving a glossy sheen.',
        hand:
          'Giant fingers hold the bun steady while the other hand brushes butter into every corner.',
        motion:
          'The brush sweeps across the bun; butter glistens, a few crumbs fall, and the bun is set face-down on the warm grill.',
        state: 'buttered brioche bun ready for toasting on a mini grill',
        next: 'the hot dog being laid on the grill beside the bun',
        focus: 'the butter sheen, soft crumb and giant fingertips',
        camera: 'slow macro push-in across the bun',
        sfx: [
          'butter brush',
          'bun crumb',
          'grill warming',
          'soft sizzle',
        ],
        duration: 5,
        ingredients: 'brioche bun, butter',
      },
      {
        name: 'Grill the Dog',
        visual:
          'The hot dog sits on the miniature grill grate; dark grill marks form and a bead of fat bubbles at the casing.',
        hand:
          'Giant fingers roll the hot dog with tiny tongs, then press it lightly so the casing hisses.',
        motion:
          'The dog rotates; grill marks appear, fat sizzles, and the casing plumps as the camera glides along the grate.',
        state: 'hot dog grilling with char marks and a plump, glossy casing',
        next: 'the hot dog being tucked into the toasted bun',
        focus: 'the blistered casing and grill marks',
        camera: 'low-angle macro track',
        sfx: [
          'hot dog sizzle',
          'casing snap',
          'tongs tap',
          'charcoal crackle',
        ],
        duration: 5,
        ingredients: 'all-beef hot dog, butter',
      },
      {
        name: 'Build the Dog',
        visual:
          'The grilled hot dog is nestled into the toasted bun; crispy onions and a pickle spear are arranged along its length.',
        hand:
          'Giant fingers place the dog, tuck in onions and lay a pickle spear with precision.',
        motion:
          'The dog settles into the bun; onions scatter, the pickle is placed, and the camera pulls back to show the loaded dog.',
        state: 'hot dog in a toasted bun with crispy onions and pickle',
        next: 'the mustard zigzag over the top',
        focus: 'the toasted bun, onions and pickle crunch',
        camera: 'slow macro tilt up the length of the dog',
        sfx: [
          'hot dog placement',
          'crispy onions',
          'pickle placement',
          'bun press',
        ],
        duration: 5,
        ingredients: 'grilled hot dog, toasted bun, crispy onions, dill pickle',
      },
      {
        name: 'Mustard Hero',
        final: true,
        visual:
          'The final hot dog gets a bright zigzag of yellow mustard; chives and crispy onions crown the top, and giant fingers make a final adjustment.',
        hand:
          'Giant fingers squeeze a tiny mustard bottle in a clean zigzag, then press one last onion into place.',
        motion:
          'Mustard lays down a glossy line; the camera follows the zigzag, the fingers withdraw, and the hero frame settles.',
        state: 'finished hot dog with mustard zigzag, chives and crispy onions',
        next: 'the final hero frame',
        focus: 'the mustard gloss, blistered dog and toasted bun',
        camera: 'slow cinematic orbit, slight top-down angle',
        sfx: [
          'mustard squeeze',
          'onion placement',
          'plate settle',
          'grill crackle',
          'breeze',
        ],
        duration: 5,
        ingredients: 'mustard, chives, crispy onions, finished hot dog',
      },
    ],
  },
  {
    id: 'buffalo-wings',
    name: 'Buffalo Wings',
    emoji: '🍗',
    cuisine: 'American bar food',
    complexity: 'medium',
    tagline: 'Fiery glaze, icy blue cheese, a crunch you can see.',
    blurb:
      'Crisp tiny wings tossed in a glossy buffalo glaze with celery and blue cheese dip.',
    keyIngredients: ['chicken wings', 'buffalo sauce', 'blue cheese', 'celery'],
    ingredients: [
      'chicken wings',
      'cornstarch',
      'smoked paprika',
      'cayenne',
      'buffalo hot sauce',
      'butter',
      'honey',
      'blue cheese',
      'sour cream',
      'celery',
    ],
    cookware: [
      'miniature cast-iron fryer',
      'tiny mixing bowl',
      'small wire rack',
      'mini dip cup',
    ],
    palette: ['#d45433', '#e9b95c', '#6a7d5a'],
    accent: '#d45433',
    tags: ['spicy', 'fried', 'bar food'],
    stages: [
      {
        name: 'Dry Rub',
        visual:
          'Tiny chicken wings are dusted with cornstarch, paprika and cayenne; the powder clings to the skin in a fine red haze.',
        hand:
          'Giant fingers toss the wings in the spice mix, coating each one evenly.',
        motion:
          'The wings tumble in the bowl; spice dust lifts, the coating thickens, and the camera follows a wing as it is set on a rack.',
        state: 'raw chicken wings coated in a red spiced dry rub on a rack',
        next: 'the wings going into the hot fryer',
        focus: 'the spiced skin texture and dust in the light',
        camera: 'slow macro orbit around the bowl',
        sfx: [
          'dry spice toss',
          'wings tumbling',
          'paprika dust settling',
          'faint fryer heat',
        ],
        duration: 5,
        ingredients: 'chicken wings, cornstarch, smoked paprika, cayenne',
      },
      {
        name: 'Crisp Fry',
        visual:
          'The wings hit the oil; a fierce bubble ring rises and the skin begins to blister and turn deep gold.',
        hand:
          'Giant fingers lower the wings with tongs, then shake the tiny basket once.',
        motion:
          'The wings settle into the oil; bubbles churn, the basket is shaken, and the camera pushes in through the steam.',
        state: 'chicken wings frying in hot oil with blistered golden skin',
        next: 'the crispy wings draining on a wire rack',
        focus: 'the blistered skin and aggressive oil bubbles',
        camera: 'low macro push-in through steam',
        sfx: [
          'loud frying',
          'oil bubbles',
          'basket shake',
          'tongs clink',
        ],
        duration: 6,
        ingredients: 'chicken wings, frying oil',
      },
      {
        name: 'Buffalo Toss',
        visual:
          'The crisp wings land in a tiny bowl of glossy buffalo sauce; the red glaze coats every ridge and a wisp of steam escapes.',
        hand:
          'Giant fingers toss the wings through the sauce with a small spoon, turning them until they are fully lacquered.',
        motion:
          'The wings tumble; sauce thickens, a glossy strand stretches, and the camera follows the last wing as it is lifted.',
        state: 'crispy wings fully coated in glossy buffalo sauce',
        next: 'the wings arranged beside blue cheese dip and celery',
        focus: 'the glossy red glaze and steam rising from the wings',
        camera: 'tight macro orbit around the bowl',
        sfx: [
          'sauce toss',
          'glaze sticking',
          'bowl tap',
          'steam release',
        ],
        duration: 5,
        ingredients: 'buffalo hot sauce, butter, honey, fried wings',
      },
      {
        name: 'Dip & Crudité',
        visual:
          'A tiny cup of blue cheese dip is swirled with a spoon; celery sticks stand beside it, frosty with cold crunch.',
        hand:
          'Giant fingers swirl the dip, then dip a wing halfway and lift it, leaving a glossy blue-cheese trail.',
        motion:
          'The spoon swirls the dip; a wing is dipped, lifted and turned, and a thick drip falls back into the cup.',
        state: 'blue cheese dip swirled with a wing being dipped, celery beside it',
        next: 'the wings being plated on a small board',
        focus: 'the chunky blue cheese, cold celery and glossy wing',
        camera: 'slow macro push-in across the dip',
        sfx: [
          'dip swirl',
          'wing dip',
          'thick drip',
          'celery snap',
        ],
        duration: 5,
        ingredients: 'blue cheese, sour cream, celery, buffalo wing',
      },
      {
        name: 'Wing Board',
        visual:
          'The glazed wings are stacked on a tiny dark board with celery, a dip cup and a scatter of chives.',
        hand:
          'Giant fingers arrange the wings in a small tower and tuck the celery beside the dip.',
        motion:
          'The wings are stacked; sauce glistens, celery is placed, and the camera circles the board at plate level.',
        state: 'buffalo wings stacked on a board with celery and blue cheese dip',
        next: 'the final hero close-up with a wing being lifted',
        focus: 'the glossy red wings and cool green celery',
        camera: 'slow lateral orbit',
        sfx: [
          'wing placement',
          'celery placement',
          'board settle',
          'sauce tack',
        ],
        duration: 5,
        ingredients: 'buffalo wings, celery, blue cheese dip, chives',
      },
      {
        name: 'Fire & Crunch Hero',
        final: true,
        visual:
          'The final wing board is a hero: glossy buffalo wings, a cool blue cheese dip and crisp celery; giant fingers lift one wing toward the lens.',
        hand:
          'Giant fingers pick up a wing, turn it so the glaze catches the light, and set it back with a final nudge.',
        motion:
          'The wing is lifted and rotated; sauce glints, a drip stretches, and the camera settles into a slow hero orbit as the fingers withdraw.',
        state: 'finished buffalo wings on a board with dip and celery',
        next: 'the final hero frame',
        focus: 'the fiery glaze, blue cheese texture and crisp celery',
        camera: 'slow cinematic orbit with a focus pull to the lifted wing',
        sfx: [
          'wing lift',
          'sauce drip',
          'celery snap',
          'board settle',
          'distant bar ambience',
        ],
        duration: 6,
        ingredients: 'buffalo wings, blue cheese dip, celery',
      },
    ],
  },
  {
    id: 'grilled-salmon',
    name: 'Grilled Salmon',
    emoji: '🐠',
    cuisine: 'Modern Western',
    complexity: 'simple',
    tagline: 'Crisp skin, blushing flesh, a lemon-butter gloss.',
    blurb:
      'A tiny salmon fillet seared skin-side down, basted with lemon-herb butter and finished with flaky salt.',
    keyIngredients: ['salmon', 'lemon', 'dill', 'butter'],
    ingredients: [
      'salmon fillet',
      'lemon',
      'fresh dill',
      'unsalted butter',
      'olive oil',
      'flaky sea salt',
      'black pepper',
      'asparagus',
    ],
    cookware: [
      'miniature cast-iron skillet',
      'tiny fish spatula',
      'small lemon press',
      'mini plating tweezers',
    ],
    palette: ['#e78c72', '#8aa78c', '#f4d99a'],
    accent: '#e78c72',
    tags: ['seafood', 'healthy', 'grill'],
    stages: [
      {
        name: 'Lemon & Herb Prep',
        visual:
          'The tiny salmon fillet rests skin-side up on a board; lemon zest, dill and flaky salt are scattered across the pale flesh.',
        hand:
          'Giant fingers press dill and zest into the salmon, then turn it to show the silver skin.',
        motion:
          'The seasoning is pressed in; lemon zest falls, the fillet is turned, and the camera glides across the skin.',
        state: 'seasoned salmon fillet on a board, skin-side up, dill and lemon zest visible',
        next: 'the salmon placed skin-side down in the hot pan',
        focus: 'the salmon skin, dill fronds and lemon zest',
        camera: 'slow overhead macro glide',
        sfx: ['dill press', 'zest falling', 'skin contact with board', 'lemon scent ambience'],
        duration: 5,
        ingredients: 'salmon fillet, lemon zest, dill, flaky sea salt',
      },
      {
        name: 'Skin Sear',
        visual:
          'The salmon goes skin-side down into a hot miniature skillet; the skin crisps and curls while the flesh turns opaque from the bottom up.',
        hand:
          'Giant fingers lay the fillet into the pan and press it flat for a few seconds with the tiny spatula.',
        motion:
          'The skin sizzles; the fillet is pressed, released, and the camera pushes in on the crisp edge and rising steam.',
        state: 'salmon searing skin-side down in a cast-iron skillet, crisp skin forming',
        next: 'butter and lemon being added for basting',
        focus: 'the crisping skin and the color change in the flesh',
        camera: 'low macro push-in along the pan',
        sfx: [
          'salmon skin sear',
          'oil sizzle',
          'spatula press',
          'steam release',
        ],
        duration: 6,
        ingredients: 'salmon fillet, olive oil, flaky sea salt',
      },
      {
        name: 'Lemon Butter Baste',
        visual:
          'Foaming lemon-herb butter is spooned over the salmon; the flesh glistens and dill floats in the golden butter.',
        hand:
          'Giant fingers tilt the pan and spoon the foaming butter over the fillet again and again.',
        motion:
          'Butter foams; the spoon bastes the salmon in glossy waves, lemon juice hits the pan and sizzles, and the camera orbits the fillet.',
        state: 'salmon basting in foaming lemon-herb butter',
        next: 'the salmon resting on a tiny rack',
        focus: 'the golden butter, dill and glossy salmon flesh',
        camera: 'tight macro orbit around the skillet',
        sfx: [
          'butter foam',
          'basting spoon',
          'lemon juice sizzle',
          'pan tap',
        ],
        duration: 5,
        ingredients: 'unsalted butter, lemon juice, dill, salmon fillet',
      },
      {
        name: 'Rest & Asparagus',
        visual:
          'The salmon rests on a tiny rack, juices pooling; blistered asparagus lies beside it with a lemon half.',
        hand:
          'Giant fingers transfer the fillet to a plate, then arrange the asparagus and a seared lemon half.',
        motion:
          'The fish is lifted carefully; the skin stays crisp, asparagus is placed, and the camera follows the lemon as it is set down.',
        state: 'rested salmon with charred asparagus and a seared lemon half',
        next: 'the final plate being finished with flaky salt and dill',
        focus: 'the crisp skin, moist flesh and blistered asparagus',
        camera: 'slow macro tilt from rack to plate',
        sfx: [
          'fish transfer',
          'asparagus placement',
          'lemon plate tap',
          'soft steam',
        ],
        duration: 5,
        ingredients: 'salmon fillet, asparagus, lemon',
      },
      {
        name: 'Lemon-Dill Hero',
        final: true,
        visual:
          'The finished salmon is plated on matte ceramic: crisp skin, blush-pink flesh, charred asparagus, dill and a lemon-butter sheen, with giant fingers making the final adjustment.',
        hand:
          'Giant fingers pinch flaky salt over the fillet, lay a dill frond on the flesh and squeeze the lemon half gently.',
        motion:
          'The lemon releases a fine mist; salt falls, dill settles, and the camera begins a slow hero orbit as the fingers withdraw.',
        state: 'finished grilled salmon plated with asparagus, dill and lemon',
        next: 'the final hero frame',
        focus: 'the crisp skin, blush flesh, lemon mist and dill',
        camera: 'slow cinematic orbit with a shallow focus falloff',
        sfx: [
          'lemon squeeze mist',
          'flaky salt falling',
          'dill placement',
          'plate settle',
          'backyard breeze',
        ],
        duration: 6,
        ingredients: 'salmon, lemon, dill, flaky sea salt, butter',
      },
    ],
  },
  {
    id: 'loaded-fries',
    name: 'Loaded Fries',
    emoji: '🍟',
    cuisine: 'American share food',
    complexity: 'medium',
    tagline: 'A molten cheese landslide over crispy fries.',
    blurb:
      'Tiny fries buried under molten cheese, bacon crumble, jalapeños and scallions.',
    keyIngredients: ['potatoes', 'cheddar', 'bacon', 'jalapeño'],
    ingredients: [
      'russet potatoes',
      'sharp cheddar sauce',
      'crispy bacon',
      'jalapeño',
      'scallions',
      'sour cream',
      'smoked paprika',
      'sea salt',
      'chives',
    ],
    cookware: [
      'miniature fry basket',
      'tiny enamel tray',
      'small cheese squeeze bottle',
      'mini serving board',
    ],
    palette: ['#e8a63e', '#c65a37', '#71864f'],
    accent: '#e8a63e',
    tags: ['fries', 'cheese', 'loaded'],
    stages: [
      {
        name: 'First Fry',
        visual:
          'Tiny matchstick fries drop into a wire basket of hot oil; the oil froths and the potatoes turn pale gold.',
        hand:
          'Giant fingers lower the basket into the fryer, then shake it once so the fries separate.',
        motion:
          'The basket is lowered; oil bubbles up, fries drift apart, and the camera follows the steam rising through the basket.',
        state: 'matchstick fries first-frying in a wire basket of hot oil',
        next: 'the fries lifted for a second, crisp fry',
        focus: 'the pale gold fries, bubbling oil and wire basket',
        camera: 'low macro push-in through steam',
        sfx: [
          'fries hitting oil',
          'frying sizzle',
          'basket shake',
          'steam hiss',
        ],
        duration: 5,
        ingredients: 'russet potatoes, frying oil, sea salt',
      },
      {
        name: 'Double-Crisp',
        visual:
          'The fries return to the oil a second time and turn deep golden; the edges crisp and a fine dust of smoked paprika waits nearby.',
        hand:
          'Giant fingers shake the basket and toss the fries with paprika and sea salt.',
        motion:
          'The fries tumble in the basket; seasoning scatters, steam billows, and the camera pushes in on the crisp edges.',
        state: 'twice-fried golden potato fries tossed with smoked paprika and salt',
        next: 'the fries spread across a tiny enamel tray',
        focus: 'the crisp edges and red paprika dust',
        camera: 'slow macro orbit around the basket',
        sfx: [
          'crisp fry sizzle',
          'basket toss',
          'salt and paprika fall',
          'steam release',
        ],
        duration: 5,
        ingredients: 'potatoes, smoked paprika, sea salt, frying oil',
      },
      {
        name: 'Cheese Landslide',
        visual:
          'Molten cheddar sauce pours from a tiny bottle over the pile of fries, flowing into the gaps and pooling at the edges.',
        hand:
          'Giant fingers squeeze the bottle in a slow spiral, then tap it once to release the last drop.',
        motion:
          'Cheese pours and spreads; the sauce coats the fries, drips between them, and the camera follows the molten flow.',
        state: 'fries covered in molten cheddar sauce, cheese pooling at the tray edges',
        next: 'bacon crumble and jalapeño being added',
        focus: 'the glossy cheese flow and the crisp fries beneath',
        camera: 'tight macro push-in following the cheese',
        sfx: [
          'cheese squeeze',
          'thick cheese pour',
          'sauce settling',
          'bottle tap',
        ],
        duration: 5,
        ingredients: 'cheddar sauce, crispy fries',
      },
      {
        name: 'Bacon & Jalapeño',
        visual:
          'Crispy bacon crumble falls over the cheese, followed by thin jalapeño slices and a scatter of scallions.',
        hand:
          'Giant fingers pinch bacon and let it fall, then place jalapeño slices carefully across the top.',
        motion:
          'Bacon rains down; jalapeños are placed, scallions scatter, and the camera rack-focuses from fingertips to the glossy tray.',
        state: 'loaded fries topped with bacon, jalapeño and scallions',
        next: 'the tray lifted toward the final serving board',
        focus: 'the bacon crumble, green jalapeño and melting cheese',
        camera: 'slow overhead drift',
        sfx: [
          'bacon crumble falling',
          'jalapeño placement',
          'scallion scatter',
          'cheese sizzle',
        ],
        duration: 5,
        ingredients: 'crispy bacon, jalapeño, scallions, cheddar sauce',
      },
      {
        name: 'Sour Cream Finish',
        visual:
          'A tiny spoon dollops sour cream across the loaded fries; chives are scattered and the cheese still bubbles at the edges.',
        hand:
          'Giant fingers tap the spoon, leaving soft peaks of sour cream, then sprinkle chives from above.',
        motion:
          'Sour cream lands in soft dollops; chives fall, cheese bubbles, and the camera pulls back to reveal the tray.',
        state: 'loaded fries finished with sour cream dollops and chives',
        next: 'the final hero pull with a cheese-covered fry',
        focus: 'the cool sour cream, bright chives and molten cheese',
        camera: 'slow pull-back macro reveal',
        sfx: [
          'sour cream dollop',
          'chive scatter',
          'cheese bubble',
          'tray settle',
        ],
        duration: 5,
        ingredients: 'sour cream, chives, loaded fries',
      },
      {
        name: 'Loaded Hero',
        final: true,
        visual:
          'The loaded fries are a hero on a tiny board: molten cheese, crisp bacon, jalapeño, sour cream and chives, with giant fingers lifting one cheese-laden fry.',
        hand:
          'Giant fingers pull a single fry from the pile, stretching a cheese strand, then set it back into the tray.',
        motion:
          'The fry lifts; cheese stretches and snaps, steam escapes, and the camera settles into a slow hero orbit as the fingers withdraw.',
        state: 'finished loaded fries with a cheese pull and all garnishes',
        next: 'the final hero frame',
        focus: 'the cheese pull, crisp fries and fresh garnishes',
        camera: 'slow cinematic orbit with a focus pull to the cheese strand',
        sfx: [
          'fry lift',
          'cheese stretch',
          'steam release',
          'tray settle',
          'backyard ambience',
        ],
        duration: 6,
        ingredients: 'loaded fries, cheddar, bacon, jalapeño, sour cream, chives',
      },
    ],
  },
];
