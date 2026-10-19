/**
 * Desi dish library.
 * Halal-friendly, no pork or alcohol. Every stage preserves bare South Asian
 * hands, clay/iron cookware, courtyard environment and live-fire warmth.
 */

export const DESI_DISHES = [
  {
    id: 'biryani',
    name: 'Chicken Biryani',
    emoji: '🍛',
    cuisine: 'Pakistani & North Indian',
    complexity: 'complex',
    tagline: 'Saffron steam, layered rice, a dum-sealed reveal.',
    blurb:
      'A miniature clay handi of saffron chicken biryani, sealed with dough and opened in a courtyard at dawn.',
    keyIngredients: ['basmati rice', 'chicken', 'saffron', 'fried onions'],
    ingredients: [
      'basmati rice',
      'bone-in chicken',
      'yogurt',
      'saffron threads',
      'warm milk',
      'fried onions',
      'mint',
      'coriander',
      'garam masala',
      'red chili',
      'ghee',
      'whole spices',
    ],
    cookware: [
      'miniature clay handi',
      'tiny brass bowl',
      'small iron karahi',
      'clay serving plate',
      'tiny dough-sealed lid',
    ],
    palette: ['#d9a441', '#c2572f', '#5e6b3e'],
    accent: '#d9a441',
    tags: ['rice', 'layered', 'dum', 'celebration'],
    stages: [
      {
        name: 'Saffron Milk',
        visual:
          'A tiny brass bowl holds warm milk; saffron threads bloom into a deep gold cloud, their color bleeding through the steam.',
        hand:
          'Giant fingers pinch saffron threads and let them fall into the milk, then stir once with a tiny brass spoon.',
        motion:
          'The threads land and unfurl; gold dye spirals through the milk, steam curls, and the camera pushes in on the bloom.',
        state: 'warm saffron milk blooming gold in a tiny brass bowl',
        next: 'the saffron milk set aside while the rice is parboiled',
        focus: 'the saffron threads, gold swirls and rising steam',
        camera: 'slow macro push-in across the brass rim',
        sfx: [
          'saffron threads falling',
          'gentle milk stir',
          'tiny brass spoon tap',
          'courtyard birds',
        ],
        duration: 4,
        ingredients: 'saffron threads, warm milk',
      },
      {
        name: 'Parboil the Rice',
        visual:
          'Basmati rice dances in a tiny clay handi of bubbling water with whole spices; long grains turn from translucent to pearly white.',
        hand:
          'Giant fingers test a grain between thumb and forefinger, then stir the rice with a small brass ladle.',
        motion:
          'The rice rolls in the boil; steam rises, a grain is lifted and pressed, and the camera follows the starch haze across the surface.',
        state: 'basmati rice parboiling with whole spices in a clay handi',
        next: 'the drained rice waiting in layers beside the marinated chicken',
        focus: 'long basmati grains, bubbles and whole spices',
        camera: 'low macro push-in through steam',
        sfx: [
          'rolling rice boil',
          'brass ladle stir',
          'bubbling water',
          'wood fire crackle',
        ],
        duration: 5,
        ingredients: 'basmati rice, water, whole spices, salt',
      },
      {
        name: 'Yogurt Marinade',
        visual:
          'Chicken pieces sit in a tiny clay bowl of thick yogurt, red chili and garam masala; the marinade clings to every cut.',
        hand:
          'Giant fingers massage the spiced yogurt into the chicken, turning each piece until it is fully coated.',
        motion:
          'The chicken turns through the marinade; yogurt folds, spice flecks spread, and the camera orbits the bowl.',
        state: 'chicken coated in a deep red yogurt marinade in a clay bowl',
        next: 'the marinated chicken being layered into the handi',
        focus: 'the spiced yogurt texture and flecks of chili',
        camera: 'slow macro orbit around the clay bowl',
        sfx: [
          'thick yogurt fold',
          'chicken turning',
          'clay bowl scrape',
          'distant courtyard ambience',
        ],
        duration: 5,
        ingredients: 'chicken, yogurt, red chili, garam masala, ginger garlic',
      },
      {
        name: 'Birista Gold',
        visual:
          'Thin onion slices fry in a small iron karahi; they turn from pale to deep amber, edges curling and crackling.',
        hand:
          'Giant fingers stir the onions with a brass spider, then lift a golden handful above the karahi to drain.',
        motion:
          'The onions sizzle and shrink; the spider lifts a crispy tangle, oil drips, and the camera follows the steam and amber color.',
        state: 'crisp golden fried onions lifted from a small iron karahi',
        next: 'the birista scattered between layers of rice and chicken',
        focus: 'the amber onion strands and shimmering ghee',
        camera: 'slow macro tracking shot above the karahi',
        sfx: [
          'onions frying',
          'ghee crackle',
          'brass spider tap',
          'oil drip',
        ],
        duration: 5,
        ingredients: 'onions, ghee, salt',
      },
      {
        name: 'Layer the Handi',
        visual:
          'Inside the clay handi, saffron rice, red chicken, mint and birista are layered in a careful pattern; ghee and saffron milk wait in tiny bowls.',
        hand:
          'Giant fingers scatter mint, birista and saffron milk over each layer, then smooth the top rice with a brass spoon.',
        motion:
          'Layers are built one by one; saffron milk is drizzled, mint falls, ghee is spooned, and the camera pulls back to reveal the full handi.',
        state:
          'layered biryani in a clay handi: rice, chicken, mint, birista, saffron and ghee',
        next: 'the dough seal being pressed around the lid',
        focus: 'the saffron-stained rice, mint and crisp onions',
        camera: 'slow overhead pull-back',
        sfx: [
          'rice layered',
          'saffron milk drizzle',
          'ghee spoon',
          'mint scatter',
        ],
        duration: 6,
        ingredients: 'parboiled rice, marinated chicken, saffron milk, mint, birista, ghee',
      },
      {
        name: 'Dum Seal',
        visual:
          'A rope of soft dough is pressed around the rim of the clay handi; the lid goes on and the seal is pinched shut.',
        hand:
          'Giant fingers press the dough against the clay rim, sealing every gap, then pat the lid once.',
        motion:
          'The dough rope is laid, pressed and pinched; the lid settles, the seal closes, and the camera circles the handi.',
        state: 'clay handi sealed with a dough rope, ready for dum',
        next: 'the sealed handi over a low fire, steam building inside',
        focus: 'the dough seal, clay texture and giant fingerprints',
        camera: 'slow macro orbit around the sealed rim',
        sfx: [
          'dough pressed',
          'clay lid settle',
          'soft pat',
          'wood fire crackle',
        ],
        duration: 5,
        ingredients: 'dough seal, clay handi',
      },
      {
        name: 'Steam Release',
        visual:
          'The dough seal is cracked open; a thick column of saffron steam escapes and the lid is lifted to reveal layered rice glistening with ghee.',
        hand:
          'Giant fingers break the seal, lift the clay lid and hold it aside as the steam rolls over the rice.',
        motion:
          'The seal cracks; steam bursts upward, the lid lifts, and the camera pushes through the haze into the layered handi.',
        state: 'dum opened, saffron steam rising from the layered biryani',
        next: 'the first spoonful being lifted through the layers',
        focus: 'the saffron steam, ghee sheen and layered rice',
        camera: 'slow push-in through steam',
        sfx: [
          'dough seal crack',
          'steam release',
          'clay lid lift',
          'rice sizzle',
        ],
        duration: 5,
        ingredients: 'sealed biryani, saffron steam, ghee',
      },
      {
        name: 'First Lift',
        visual:
          'A brass spoon cuts through the layers, lifting saffron rice, tender chicken and birista together; steam curls around the spoon.',
        hand:
          'Giant fingers guide the spoon deep into the handi, turn it gently and lift a full, steaming portion.',
        motion:
          'The spoon sinks, turns and rises; grains cascade, chicken falls apart, and the camera follows the steam toward the plate.',
        state: 'steaming spoonful of biryani lifted from the handi',
        next: 'the biryani being plated with raita and mint',
        focus: 'the saffron rice, tender chicken and falling grains',
        camera: 'slow macro tracking shot from handi to plate',
        sfx: [
          'spoon through rice',
          'grains falling',
          'steam release',
          'plate waiting',
        ],
        duration: 5,
        ingredients: 'biryani, saffron rice, chicken, birista',
      },
      {
        name: 'Plate & Raita',
        visual:
          'The biryani is mounded on a tiny terracotta plate; a small clay bowl of raita sits beside it with mint and a dusting of cumin.',
        hand:
          'Giant fingers center the rice, place the raita, and scatter fresh mint over the top.',
        motion:
          'The rice is mounded; raita is set down, mint falls, and the camera pulls back to reveal the full plate.',
        state: 'plated biryani with raita, mint and cumin on a terracotta plate',
        next: 'the final garnish and hero frame',
        focus: 'the saffron rice, cool raita and fresh mint',
        camera: 'slow overhead pull-back',
        sfx: [
          'rice plating',
          'clay bowl placement',
          'mint scatter',
          'cumin dusting',
        ],
        duration: 5,
        ingredients: 'biryani, raita, mint, cumin',
      },
      {
        name: 'Saffron Hero',
        final: true,
        visual:
          'The final biryani plate is a hero: saffron-stained rice, tender chicken, crisp birista, mint and a small bowl of raita, with giant fingers placing the last saffron strand.',
        hand:
          'Giant fingers lay a single saffron strand on the rice, press a mint leaf into place and gently squeeze a lemon wedge over the plate.',
        motion:
          'The lemon releases a mist; saffron and mint settle, steam curls, and the camera begins a slow hero orbit as the fingers withdraw.',
        state: 'finished biryani plated with raita, mint, birista and saffron',
        next: 'the final hero frame',
        focus: 'the saffron rice, ghee sheen, mint and giant fingertips',
        camera: 'slow cinematic orbit with a shallow focus falloff',
        sfx: [
          'lemon squeeze',
          'mint placement',
          'rice settle',
          'clay plate tap',
          'distant courtyard birds',
        ],
        duration: 6,
        ingredients: 'biryani, saffron, mint, lemon, raita, birista',
      },
    ],
  },
  {
    id: 'nihari',
    name: 'Lamb Nihari',
    emoji: '🥘',
    cuisine: 'Pakistani',
    complexity: 'complex',
    tagline: 'A slow-braised shank in a glossy, spice-dark gravy.',
    blurb:
      'A miniature clay handi of lamb nihari, simmered low with toasted spices and finished with ginger, chili and lime.',
    keyIngredients: ['lamb shank', 'nihari masala', 'ginger', 'ghee'],
    ingredients: [
      'lamb shank',
      'nihari masala',
      'ginger',
      'garlic',
      'ghee',
      'wheat flour',
      'bone broth',
      'green chili',
      'coriander',
      'lemon',
      'whole spices',
      'fried onions',
    ],
    cookware: [
      'miniature clay handi',
      'small iron karahi',
      'tiny brass ladle',
      'clay serving bowl',
    ],
    palette: ['#8f3b2e', '#d99b45', '#4d5a3a'],
    accent: '#c2572f',
    tags: ['slow-cooked', 'stew', 'winter'],
    stages: [
      {
        name: 'Toast the Spices',
        visual:
          'Whole spices—cumin, coriander, fennel, black cardamom—toast in a small iron pan; their oils darken the seeds and a fragrant haze rises.',
        hand:
          'Giant fingers shake the pan, then pinch the toasted spices into a tiny stone grinder.',
        motion:
          'The spices shift and crackle; the pan is tilted, seeds fall into the grinder, and the camera follows the dust and steam.',
        state: 'toasted whole spices in a small iron pan and stone grinder',
        next: 'the lamb shank being seared in ghee',
        focus: 'the dark toasted seeds, oil sheen and spice dust',
        camera: 'slow macro push-in across the pan',
        sfx: [
          'whole spices crackling',
          'iron pan tap',
          'stone grinder',
          'wood fire crackle',
        ],
        duration: 5,
        ingredients: 'cumin, coriander, fennel, black cardamom',
      },
      {
        name: 'Sear the Shank',
        visual:
          'The tiny lamb shank sears in ghee inside an iron karahi; its surface turns deep brown and a crust forms around the bone.',
        hand:
          'Giant fingers turn the shank with a brass spoon, pressing it into the hot ghee.',
        motion:
          'The shank rotates and sears; ghee bubbles, the crust deepens, and the camera pushes in on the caramelized surface.',
        state: 'lamb shank seared deep brown in ghee, crust forming around the bone',
        next: 'the shank and toasted spices going into the clay handi',
        focus: 'the browned crust, exposed bone and bubbling ghee',
        camera: 'low macro orbit around the karahi',
        sfx: [
          'meat searing',
          'ghee sizzle',
          'brass spoon tap',
          'fire crackle',
        ],
        duration: 6,
        ingredients: 'lamb shank, ghee, salt',
      },
      {
        name: 'Slow Braise',
        visual:
          'The shank sits in a clay handi of dark broth with toasted spices and fried onions; small bubbles rise slowly from the depths.',
        hand:
          'Giant fingers lower the lid, then adjust the wood beneath the chulha with a small iron poker.',
        motion:
          'The lid settles; the broth begins to bubble, steam escapes the rim, and the camera drifts through the smoke toward the handi.',
        state: 'lamb nihari braising slowly in a clay handi over low wood fire',
        next: 'the tarka being prepared in a small pan',
        focus: 'the dark broth, slow bubbles and clay handi texture',
        camera: 'slow macro drift through wood smoke',
        sfx: [
          'slow bubbling stew',
          'wood fire crackle',
          'clay lid settle',
          'iron poker tap',
        ],
        duration: 6,
        ingredients: 'lamb shank, bone broth, nihari masala, fried onions, whole spices',
      },
      {
        name: 'Tarka',
        visual:
          'Ghee melts in a tiny pan with sliced ginger and garlic; the aromatics turn golden and a glossy tarka sizzles at the edges.',
        hand:
          'Giant fingers stir the tarka with a small brass spoon, then pour it over the braise in a slow golden stream.',
        motion:
          'The tarka sizzles; ginger edges curl, the pan is tilted, and the golden fat pours into the dark handi with a loud hiss.',
        state: 'golden ginger-garlic tarka being poured into the nihari handi',
        next: 'the flour slurry being whisked into the gravy',
        focus: 'the golden tarka, ginger slivers and glossy ghee',
        camera: 'slow macro tilt from pan to handi',
        sfx: [
          'tarka sizzle',
          'ghee pour',
          'loud stew hiss',
          'brass spoon tap',
        ],
        duration: 5,
        ingredients: 'ghee, ginger, garlic, nihari broth',
      },
      {
        name: 'Slurry & Silk',
        visual:
          'A tiny whisk blends wheat flour with broth in a small bowl; the pale slurry is poured into the handi, turning the gravy glossy.',
        hand:
          'Giant fingers whisk the slurry smooth, then pour it in a thin stream while the other hand stirs the handi.',
        motion:
          'The slurry flows in; the gravy swirls, thickens and begins to shine, and the camera pushes in on the silky surface.',
        state: 'nihari gravy thickening to a glossy, silky consistency',
        next: 'the gravy reducing until the oil separates at the edges',
        focus: 'the glossy gravy, whisk and flour ribbons',
        camera: 'slow macro push-in across the handi',
        sfx: [
          'whisk against clay',
          'slurry pour',
          'gentle stew bubble',
          'ladle stir',
        ],
        duration: 5,
        ingredients: 'wheat flour, nihari broth, gravy',
      },
      {
        name: 'Reduce & Shimmer',
        visual:
          'The nihari bubbles slowly; a glossy layer of spiced oil separates at the edges, catching the firelight like liquid amber.',
        hand:
          'Giant fingers skim the surface with a brass spoon and let the oil run back in a shining ribbon.',
        motion:
          'The spoon skims the surface; oil pools, the gravy trembles, and the camera follows the amber glint across the handi.',
        state: 'reduced nihari with glossy spiced oil shimmering at the edges',
        next: 'the final garnish of ginger, chili and coriander',
        focus: 'the amber oil, slow bubbles and deep gravy color',
        camera: 'low macro slide along the handi rim',
        sfx: [
          'slow stew simmer',
          'brass spoon skim',
          'oil shimmer',
          'fire crackle',
        ],
        duration: 5,
        ingredients: 'nihari gravy, spiced oil',
      },
      {
        name: 'Ginger & Chili',
        visual:
          'Julienned ginger, sliced green chili and coriander are scattered over the nihari; each garnish lands in the glossy gravy.',
        hand:
          'Giant fingers pinch ginger and chili, placing them in a careful arc across the surface.',
        motion:
          'Ginger falls, chili slices settle, coriander scatters, and the camera racks focus from the fingertips to the shimmering stew.',
        state: 'nihari topped with ginger julienne, green chili and coriander',
        next: 'the nihari being ladled beside torn naan',
        focus: 'the bright ginger, green chili and glossy dark gravy',
        camera: 'slow overhead drift',
        sfx: [
          'ginger garnish',
          'chili placement',
          'coriander scatter',
          'gravy bubble',
        ],
        duration: 4,
        ingredients: 'ginger, green chili, coriander, nihari',
      },
      {
        name: 'Naan & Bowl',
        visual:
          'A tiny clay bowl of nihari sits beside torn naan; the shank bone rises from the gravy and steam curls around the rim.',
        hand:
          'Giant fingers ladle the nihari into the bowl, place the shank, and tear the naan beside it.',
        motion:
          'The ladle pours; the shank settles, naan is torn, and the camera pulls back to reveal the steaming bowl.',
        state: 'nihari served in a clay bowl with torn naan and steam',
        next: 'the final ginger garnish and hero frame',
        focus: 'the shank, glossy gravy and soft naan',
        camera: 'slow macro pull-back',
        sfx: [
          'nihari ladle pour',
          'naan tear',
          'clay bowl placement',
          'steam release',
        ],
        duration: 5,
        ingredients: 'nihari, lamb shank, naan',
      },
      {
        name: 'Nihari Hero',
        final: true,
        visual:
          'The final nihari bowl is a hero: lamb shank rising from glossy gravy, ginger, chili and coriander on top, naan at the edge, and giant fingers making a last adjustment.',
        hand:
          'Giant fingers place a final ginger julienne, squeeze a lemon wedge over the shank and press a coriander leaf into the gravy.',
        motion:
          'Lemon mist falls; ginger settles, the gravy trembles, and the camera settles into a slow hero orbit as the fingers withdraw.',
        state: 'finished nihari bowl with garnish, lemon and naan',
        next: 'the final hero frame',
        focus: 'the glossy gravy, tender shank and bright garnish',
        camera: 'slow cinematic orbit around the clay bowl',
        sfx: [
          'lemon squeeze',
          'ginger placement',
          'gravy settle',
          'clay bowl tap',
          'fire crackle and birds',
        ],
        duration: 6,
        ingredients: 'nihari, ginger, lemon, coriander, naan',
      },
    ],
  },
  {
    id: 'karahi',
    name: 'Chicken Karahi',
    emoji: '🍲',
    cuisine: 'Pakistani',
    complexity: 'medium',
    tagline: 'Tomato-rich, ginger-bright, straight from the iron karahi.',
    blurb:
      'Bone-in chicken tossed with tomatoes, green chili and ginger in a miniature black iron karahi.',
    keyIngredients: ['chicken', 'tomato', 'ginger', 'green chili'],
    ingredients: [
      'bone-in chicken',
      'tomatoes',
      'ginger',
      'garlic',
      'green chili',
      'coriander',
      'ghee',
      'cumin',
      'red chili',
      'yogurt',
      'garam masala',
    ],
    cookware: [
      'miniature black iron karahi',
      'tiny brass spoon',
      'small clay prep bowl',
      'terracotta serving plate',
    ],
    palette: ['#c2572f', '#d9a441', '#5e6b3e'],
    accent: '#c2572f',
    tags: ['quick', 'spicy', 'wok'],
    stages: [
      {
        name: 'Chicken & Ginger',
        visual:
          'Bone-in chicken pieces rest in a tiny clay bowl with ginger, garlic and yogurt; the marinade clings to the cut edges.',
        hand:
          'Giant fingers turn the chicken through the marinade, pressing ginger into every piece.',
        motion:
          'The chicken turns; yogurt coats the surface, ginger slivers cling, and the camera orbits the bowl.',
        state: 'chicken pieces coated in ginger-garlic yogurt marinade',
        next: 'the chicken going into the hot iron karahi',
        focus: 'the yogurt coating, ginger slivers and chicken texture',
        camera: 'slow macro orbit around the clay bowl',
        sfx: [
          'yogurt fold',
          'chicken turning',
          'clay bowl scrape',
          'fire crackle',
        ],
        duration: 4,
        ingredients: 'chicken, ginger, garlic, yogurt, red chili',
      },
      {
        name: 'Tomato Base',
        visual:
          'Chopped tomatoes sizzle in the iron karahi; their skins soften and release a bright red juice around the chicken.',
        hand:
          'Giant fingers stir the tomatoes with a brass spoon, pressing them against the hot iron.',
        motion:
          'Tomatoes collapse; juice bubbles, the base thickens, and the camera pushes in on the glossy red gravy.',
        state: 'tomatoes breaking down into a bright red base in the karahi',
        next: 'the chicken being tossed through the tomato base',
        focus: 'the collapsing tomato skins and bubbling juice',
        camera: 'low macro push-in across the karahi',
        sfx: [
          'tomatoes sizzling',
          'brass spoon stir',
          'juice bubbling',
          'iron karahi heat',
        ],
        duration: 5,
        ingredients: 'tomatoes, ghee, cumin, red chili',
      },
      {
        name: 'High-Heat Toss',
        visual:
          'Chicken pieces are tossed through the tomato base over a fierce flame; steam and smoke rise as the gravy clings and darkens.',
        hand:
          'Giant fingers grip the karahi handle with a cloth and toss the contents; the other hand stirs with a brass spoon.',
        motion:
          'The karahi is jerked forward and back; chicken pieces leap, gravy coats them, flames flare beneath, and the camera shakes slightly with the heat.',
        state: 'chicken and tomato gravy tossed over high flame in an iron karahi',
        next: 'green chili, ginger and coriander being added',
        focus: 'the glossy gravy, charred edges and leaping flame',
        camera: 'handheld-style macro with subtle heat shake',
        sfx: [
          'karahi toss',
          'gravy sizzle',
          'flame flare',
          'metal handle tap',
        ],
        duration: 6,
        ingredients: 'chicken, tomato gravy, ghee',
      },
      {
        name: 'Green & Bright',
        visual:
          'Sliced green chilies, julienned ginger and coriander land on the bubbling karahi; the colors pop against the deep red gravy.',
        hand:
          'Giant fingers scatter chilies and ginger, then tear coriander over the top.',
        motion:
          'Chilies settle, ginger falls, coriander scatters, and the camera follows the steam curling around the green garnish.',
        state: 'karahi topped with green chili, ginger and coriander',
        next: 'the karahi resting off the flame',
        focus: 'the bright green chilies, ginger and glossy red gravy',
        camera: 'slow overhead drift',
        sfx: [
          'chili placement',
          'ginger scatter',
          'coriander tear',
          'gravy bubble',
        ],
        duration: 4,
        ingredients: 'green chili, ginger, coriander, karahi',
      },
      {
        name: 'Rest in Iron',
        visual:
          'The karahi rests off the flame; the gravy settles, oil glistens at the edges and a final wisp of steam rises from the chicken.',
        hand:
          'Giant fingers wipe the karahi rim with a cloth and set it on a tiny woven mat.',
        motion:
          'The karahi is set down; gravy settles, steam slows, and the camera orbits the iron rim and dark red contents.',
        state: 'finished karahi resting on a woven mat, gravy settled',
        next: 'the karahi being carried to the serving plate',
        focus: 'the iron texture, glossy gravy and lazy steam',
        camera: 'slow macro orbit',
        sfx: [
          'karahi set down',
          'cloth wipe',
          'gravy settle',
          'courtyard ambience',
        ],
        duration: 4,
        ingredients: 'chicken karahi, gravy, ginger',
      },
      {
        name: 'Karahi Plate',
        visual:
          'The karahi is tipped over a terracotta plate; chicken, gravy and green chili slide out in a glossy cascade.',
        hand:
          'Giant fingers hold the karahi handle and guide the pour, then set the karahi aside.',
        motion:
          'The karahi tilts; the stew slides onto the plate, gravy pools, chilies settle, and the camera follows the flow.',
        state: 'karahi served on a terracotta plate with gravy and chilies',
        next: 'the final garnish and naan being added',
        focus: 'the glossy cascade, chicken pieces and green chili',
        camera: 'slow macro tilt from karahi to plate',
        sfx: [
          'stew sliding',
          'terracotta plate contact',
          'karahi set down',
          'gravy settle',
        ],
        duration: 5,
        ingredients: 'chicken karahi, gravy, green chili',
      },
      {
        name: 'Karahi Hero',
        final: true,
        visual:
          'The final karahi plate is a hero: glossy tomato gravy, bone-in chicken, green chilies and ginger, with torn naan and giant fingers making a last adjustment.',
        hand:
          'Giant fingers place a ginger julienne on the chicken, tuck naan beside the plate and lift away.',
        motion:
          'Ginger settles, steam curls, the gravy trembles, and the camera settles into a slow hero orbit.',
        state: 'finished chicken karahi plated with naan, ginger and coriander',
        next: 'the final hero frame',
        focus: 'the glossy red gravy, chicken and bright ginger',
        camera: 'slow cinematic orbit with a shallow focus falloff',
        sfx: [
          'naan placement',
          'ginger garnish',
          'gravy settle',
          'plate tap',
          'distant courtyard birds',
        ],
        duration: 6,
        ingredients: 'chicken karahi, naan, ginger, coriander',
      },
    ],
  },
  {
    id: 'chapli-kabab',
    name: 'Chapli Kabab',
    emoji: '🥩',
    cuisine: 'Pakistani',
    complexity: 'medium',
    tagline: 'Crisp-edged, pomegranate-scented, impossibly juicy.',
    blurb:
      'A miniature Peshawari chapli kabab with a crunchy edge, fresh herbs and a squeeze of lemon.',
    keyIngredients: ['beef mince', 'pomegranate seeds', 'coriander', 'tomato'],
    ingredients: [
      'beef mince',
      'onion',
      'tomato',
      'coriander',
      'green chili',
      'pomegranate seeds',
      'coriander seeds',
      'egg',
      'gram flour',
      'ginger',
      'lemon',
    ],
    cookware: [
      'miniature clay tawa',
      'small iron karahi',
      'tiny mixing bowl',
      'terracotta serving plate',
    ],
    palette: ['#a8482f', '#d9a441', '#5e6b3e'],
    accent: '#c2572f',
    tags: ['kabab', 'fried', 'street food'],
    stages: [
      {
        name: 'Mince & Spice',
        visual:
          'A tiny bowl holds coarse beef mince with coriander seeds, pomegranate seeds, chopped onion and green chili; the colors are vivid against the raw meat.',
        hand:
          'Giant fingers scatter spices over the mince and press them in before the mix is turned.',
        motion:
          'Spices fall into the mince; the fingers fold the mix once, and the camera pushes in on the pomegranate seeds and meat grain.',
        state: 'spiced beef mince with pomegranate, coriander seeds and green chili',
        next: 'the mixture being kneaded smooth',
        focus: 'the coarse mince, pomegranate seeds and spice flecks',
        camera: 'slow top-down macro push-in',
        sfx: [
          'spices falling',
          'mince press',
          'clay bowl scrape',
          'fire crackle',
        ],
        duration: 4,
        ingredients: 'beef mince, pomegranate seeds, coriander seeds, green chili, onion',
      },
      {
        name: 'Knead & Rest',
        visual:
          'The kabab mixture is kneaded in the bowl; it becomes sticky, cohesive and glossy, with herb flecks evenly distributed.',
        hand:
          'Giant fingers knead the mixture with a firm heel-of-hand press, folding it over itself again and again.',
        motion:
          'The mix folds and presses; it turns glossy, the bowl is scraped clean, and the camera orbits the kneading fingers.',
        state: 'smooth, sticky chapli kabab mixture ready to shape',
        next: 'the mixture being shaped into a flat patty',
        focus: 'the glossy mince texture, herb flecks and giant knuckles',
        camera: 'tight macro orbit around the bowl',
        sfx: [
          'mince kneading',
          'sticky fold',
          'clay bowl scrape',
          'soft fire crackle',
        ],
        duration: 4,
        ingredients: 'beef mince, egg, gram flour, coriander, onion',
      },
      {
        name: 'Patty Form',
        visual:
          'A flat, wide kabab is pressed onto a tiny board; a tomato slice and a few coriander leaves are set into the top, and a thumb dimple marks the center.',
        hand:
          'Giant fingers pat the kabab flat, press a tomato slice into the surface and make a gentle thumb dimple.',
        motion:
          'The patty is flattened; tomato and coriander are pressed in, the thumb lifts, and the camera follows the dimple filling with juice.',
        state: 'raw chapli kabab shaped with tomato and coriander pressed into the top',
        next: 'the kabab sliding into the shallow oil',
        focus: 'the tomato slice, herb leaves and thumb-dimpled surface',
        camera: 'slow macro tilt across the board',
        sfx: [
          'patty press',
          'tomato placement',
          'coriander press',
          'board tap',
        ],
        duration: 4,
        ingredients: 'kabab mixture, tomato, coriander',
      },
      {
        name: 'Shallow Fry',
        visual:
          'The kabab sizzles in a shallow pool of oil on a small iron pan; the edges crisp and the tomato slice softens.',
        hand:
          'Giant fingers slide the kabab into the oil, then spoon hot oil over the top.',
        motion:
          'The kabab settles; oil bubbles around the edges, the top is basted, and the camera pushes in on the crisp rim.',
        state: 'chapli kabab shallow-frying, edges crisping, tomato softening',
        next: 'the kabab being flipped for the second side',
        focus: 'the crisp edges, bubbling oil and softening tomato',
        camera: 'low macro push-in along the pan',
        sfx: [
          'kabab frying',
          'oil bubbles',
          'hot oil basting',
          'pan sizzle',
        ],
        duration: 5,
        ingredients: 'chapli kabab, frying oil',
      },
      {
        name: 'Flip & Drain',
        visual:
          'The kabab is flipped, revealing a deep brown crust; it is lifted onto a tiny wire rack and a fresh lemon half waits beside it.',
        hand:
          'Giant fingers turn the kabab with a small spatula, then lift it onto the rack.',
        motion:
          'The kabab flips; oil drips, the crust crackles, and the camera follows the transfer to the rack.',
        state: 'finished chapli kabab draining on a wire rack, lemon nearby',
        next: 'the kabab being plated with chutney and onion',
        focus: 'the deep brown crust, dripping oil and lemon',
        camera: 'slow macro tracking shot',
        sfx: [
          'kabab flip',
          'crust crackle',
          'oil drip',
          'rack settle',
        ],
        duration: 4,
        ingredients: 'chapli kabab, lemon',
      },
      {
        name: 'Chutney Hero',
        final: true,
        visual:
          'The final chapli kabab sits on a terracotta plate with mint chutney, onion rings and a lemon wedge; giant fingers press a coriander leaf into the crust.',
        hand:
          'Giant fingers squeeze lemon over the kabab, place onion rings beside it and press a coriander leaf onto the crisp edge.',
        motion:
          'Lemon mist falls; the kabab glistens, onion rings settle, and the camera begins a slow hero orbit.',
        state: 'finished chapli kabab plated with chutney, onion and lemon',
        next: 'the final hero frame',
        focus: 'the crisp kabab edge, chutney gloss and lemon mist',
        camera: 'slow cinematic orbit with a shallow focus falloff',
        sfx: [
          'lemon squeeze',
          'onion ring placement',
          'crust crackle',
          'plate settle',
          'courtyard birds',
        ],
        duration: 6,
        ingredients: 'chapli kabab, mint chutney, onion, lemon, coriander',
      },
    ],
  },
  {
    id: 'samosa',
    name: 'Samosa',
    emoji: '🥟',
    cuisine: 'Pakistani & North Indian',
    complexity: 'complex',
    tagline: 'A crisp golden shell, a spiced potato heart.',
    blurb:
      'Hand-folded miniature samosas filled with spiced potato and peas, fried until blistered and served with chutney.',
    keyIngredients: ['flour', 'potato', 'peas', 'cumin'],
    ingredients: [
      'all-purpose flour',
      'ghee',
      'ajwain',
      'potato',
      'green peas',
      'cumin seeds',
      'coriander',
      'green chili',
      'ginger',
      'mint chutney',
      'frying oil',
    ],
    cookware: [
      'miniature clay board',
      'small iron karahi',
      'tiny rolling pin',
      'brass tongs',
      'terracotta serving plate',
    ],
    palette: ['#d9a441', '#6f8a4f', '#a8482f'],
    accent: '#d9a441',
    tags: ['pastry', 'fried', 'snack'],
    stages: [
      {
        name: 'Knead the Dough',
        visual:
          'Flour, ghee and ajwain sit in a tiny clay bowl; water is added and the mixture is worked into a smooth, stiff dough.',
        hand:
          'Giant fingers knead the dough against the clay, folding and pressing until it turns silky.',
        motion:
          'The dough is folded and pressed; it smooths out, a thumb leaves a soft indent, and the camera orbits the bowl.',
        state: 'smooth samosa dough resting in a clay bowl',
        next: 'the dough resting under a cloth while the filling is made',
        focus: 'the silky dough, ajwain flecks and giant fingertips',
        camera: 'tight macro orbit around the bowl',
        sfx: [
          'dough kneading',
          'clay bowl scrape',
          'soft flour dust',
          'fire crackle',
        ],
        duration: 5,
        ingredients: 'all-purpose flour, ghee, ajwain, water, salt',
      },
      {
        name: 'Potato Filling',
        visual:
          'Boiled potato cubes, green peas, cumin and coriander sizzle in a small pan; the filling is chunky and bright.',
        hand:
          'Giant fingers crush a potato cube to check the texture, then stir the filling with a brass spoon.',
        motion:
          'The filling sizzles; potatoes break slightly, peas roll, and the camera pushes in on the steam and spice flecks.',
        state: 'spiced potato and pea filling cooling in a small pan',
        next: 'the filling being spooned onto the dough',
        focus: 'the chunky potato, green peas and cumin seeds',
        camera: 'slow macro push-in across the pan',
        sfx: [
          'filling sizzle',
          'potato crush',
          'brass spoon stir',
          'cumin crackle',
        ],
        duration: 5,
        ingredients: 'potato, green peas, cumin, coriander, green chili, ginger',
      },
      {
        name: 'Roll & Cut',
        visual:
          'A tiny rolling pin flattens the dough into a thin oval; a small knife cuts it into clean semicircles, flour dusting the clay board.',
        hand:
          'Giant fingers roll the dough thin, then guide the knife through it in one clean stroke.',
        motion:
          'The pin rolls forward; the dough stretches, the knife cuts, and the semicircles are lifted and stacked.',
        state: 'thin dough ovals cut into semicircles on a floured clay board',
        next: 'the first semicircle being folded into a cone',
        focus: 'the translucent dough, clean cut edge and flour dust',
        camera: 'slow overhead macro glide',
        sfx: [
          'rolling pin',
          'dough stretch',
          'knife cut',
          'flour dust',
        ],
        duration: 4,
        ingredients: 'samosa dough, flour for dusting',
      },
      {
        name: 'Fold the Cone',
        visual:
          'A dough semicircle is folded into a neat cone; flour paste seals the seam and the pocket stands ready.',
        hand:
          'Giant fingers pinch the seam, run a fingertip of flour paste along the edge and press it closed.',
        motion:
          'The dough folds; the seam is sealed, the cone is opened, and the camera follows the precise fingerwork.',
        state: 'empty samosa cone sealed and ready for filling',
        next: 'the potato filling being spooned into the cone',
        focus: 'the folded seam, dough layers and giant fingertips',
        camera: 'tight macro profile',
        sfx: [
          'dough fold',
          'paste brush',
          'seam press',
          'soft board tap',
        ],
        duration: 5,
        ingredients: 'dough semicircle, flour paste',
      },
      {
        name: 'Fill & Seal',
        visual:
          'The cone is filled with spiced potato and peas; the top edge is brushed with paste and pinched into a crisp triangular samosa.',
        hand:
          'Giant fingers spoon in the filling, press it down, then seal the top with a neat pinch.',
        motion:
          'Filling drops into the cone; the edge is brushed, pinched and crimped, and the finished samosa is set on the board.',
        state: 'filled, sealed triangular samosa on the clay board',
        next: 'the samosa being lowered into the hot oil',
        focus: 'the full cone, crimped edge and potato filling',
        camera: 'slow macro push-in on the seal',
        sfx: [
          'filling spoon',
          'paste brush',
          'crimp press',
          'board settle',
        ],
        duration: 5,
        ingredients: 'samosa cone, potato filling, flour paste',
      },
      {
        name: 'Golden Fry',
        visual:
          'Samosas bob in a small iron karahi of hot oil; the shells blister and turn deep gold while bubbles stream from the seams.',
        hand:
          'Giant fingers turn the samosas with brass tongs and spoon hot oil over the tops.',
        motion:
          'The samosas rotate; oil bubbles, the shells crisp, and the camera follows the golden color climbing the pastry.',
        state: 'samosas frying golden in a small iron karahi',
        next: 'the samosas draining on a wire rack',
        focus: 'the blistered pastry, bubbles and golden seams',
        camera: 'low macro orbit around the karahi',
        sfx: [
          'samosa frying',
          'oil bubbles',
          'brass tongs tap',
          'hot oil basting',
        ],
        duration: 6,
        ingredients: 'samosas, frying oil',
      },
      {
        name: 'Drain & Crackle',
        visual:
          'The golden samosas rest on a tiny rack; oil glistens on the blistered shells and a small bowl of mint chutney waits nearby.',
        hand:
          'Giant fingers lift one samosa, tap it once to release excess oil and set it back with a crisp crackle.',
        motion:
          'The samosa is tapped; oil flecks fall, the shell crackles, and the camera pushes in on the crisp surface.',
        state: 'fried samosas draining on a rack, mint chutney nearby',
        next: 'the samosas being plated for the hero shot',
        focus: 'the blistered golden shell and oil droplets',
        camera: 'tight macro push-in',
        sfx: [
          'samosa tap',
          'crisp crackle',
          'oil drip',
          'rack settle',
        ],
        duration: 4,
        ingredients: 'fried samosas, mint chutney',
      },
      {
        name: 'Chutney Hero',
        final: true,
        visual:
          'The final samosas are piled on a terracotta plate with mint chutney and a lemon wedge; giant fingers break one open to reveal the steaming potato filling.',
        hand:
          'Giant fingers hold a samosa and break it gently, then dip the corner into chutney and set it back on the plate.',
        motion:
          'The shell cracks; steam escapes, the filling glows, the chutney clings, and the camera settles into a slow hero orbit.',
        state: 'finished samosas plated with chutney, one broken open and steaming',
        next: 'the final hero frame',
        focus: 'the crisp shell, steaming filling and green chutney',
        camera: 'slow cinematic orbit with a focus pull to the broken samosa',
        sfx: [
          'samosa crack',
          'steam release',
          'chutney dip',
          'plate settle',
          'courtyard ambience',
        ],
        duration: 6,
        ingredients: 'samosa, mint chutney, lemon, potato filling',
      },
    ],
  },
  {
    id: 'pakora',
    name: 'Pakora',
    emoji: '🍤',
    cuisine: 'Pakistani & North Indian',
    complexity: 'simple',
    tagline: 'Crispy chickpea fritters, green chili, monsoon energy.',
    blurb:
      'Onion, potato and spinach pakoras fried in a tiny karahi, served with mint chutney and lemon.',
    keyIngredients: ['besan', 'onion', 'spinach', 'green chili'],
    ingredients: [
      'gram flour',
      'onion',
      'potato',
      'spinach',
      'green chili',
      'ajwain',
      'coriander',
      'red chili',
      'baking soda',
      'frying oil',
      'mint chutney',
      'lemon',
    ],
    cookware: [
      'miniature clay mixing bowl',
      'small iron karahi',
      'tiny brass spider',
      'terracotta serving plate',
    ],
    palette: ['#d9a441', '#6f8a4f', '#c2572f'],
    accent: '#d9a441',
    tags: ['fried', 'snack', 'vegetarian'],
    stages: [
      {
        name: 'Besan Batter',
        visual:
          'Gram flour, water, ajwain and red chili are whisked into a thick golden batter in a clay bowl; bubbles sit on the surface.',
        hand:
          'Giant fingers whisk the batter with a small brass spoon, then lift a ribbon to check the coating consistency.',
        motion:
          'The batter thickens; a ribbon lifts and falls, bubbles break, and the camera pushes in on the golden texture.',
        state: 'thick golden besan batter with ajwain and chili flecks',
        next: 'the vegetables being folded into the batter',
        focus: 'the batter ribbon, bubbles and spice flecks',
        camera: 'slow top-down macro push-in',
        sfx: [
          'batter whisk',
          'thick drip',
          'clay bowl tap',
          'fire crackle',
        ],
        duration: 4,
        ingredients: 'gram flour, water, ajwain, red chili, salt',
      },
      {
        name: 'Coat the Vegetables',
        visual:
          'Sliced onion, potato and spinach are folded into the batter; each piece is coated in a golden shell.',
        hand:
          'Giant fingers fold the vegetables through the batter, pressing spinach leaves down until they are fully submerged.',
        motion:
          'The vegetables turn; batter climbs through the layers, spinach folds, and the camera orbits the bowl.',
        state: 'mixed vegetable pakora batter with onion, potato and spinach',
        next: 'the first spoonful being dropped into the oil',
        focus: 'the coated onion rings and spinach leaves',
        camera: 'slow macro orbit around the clay bowl',
        sfx: [
          'vegetables folding',
          'thick batter squelch',
          'bowl scrape',
          'soft fire crackle',
        ],
        duration: 4,
        ingredients: 'onion, potato, spinach, besan batter',
      },
      {
        name: 'First Drop',
        visual:
          'A spoonful of pakora batter is lowered into hot oil; it puffs, spreads and immediately turns golden at the edges.',
        hand:
          'Giant fingers use a brass spoon to drop irregular clusters into the karahi, then use a spider to keep them moving.',
        motion:
          'The batter slides into the oil; it puffs, bubbles violently, and the camera follows the first golden crust forming.',
        state: 'pakoras puffing in hot oil in a small iron karahi',
        next: 'the pakoras frying to a deep golden color',
        focus: 'the puffing batter and aggressive oil bubbles',
        camera: 'low macro push-in through steam',
        sfx: [
          'batter into oil',
          'loud frying',
          'oil bubbles',
          'brass spider tap',
        ],
        duration: 5,
        ingredients: 'pakora batter, frying oil',
      },
      {
        name: 'Fry & Drain',
        visual:
          'The golden pakoras are turned and lifted from the karahi; oil drips from their craggy edges onto a tiny rack.',
        hand:
          'Giant fingers turn the pakoras with the spider, then lift them and tap the spider once.',
        motion:
          'The pakoras rotate; the spider lifts, oil drips, and the camera follows the transfer to the rack.',
        state: 'golden pakoras draining on a tiny wire rack',
        next: 'the pakora plate being assembled with chutney and lemon',
        focus: 'the craggy golden crust and dripping oil',
        camera: 'slow macro tracking shot',
        sfx: [
          'pakora frying',
          'spider lift',
          'oil drip',
          'rack settle',
        ],
        duration: 4,
        ingredients: 'fried pakoras, salt',
      },
      {
        name: 'Chutney Hero',
        final: true,
        visual:
          'The finished pakoras are piled on a terracotta plate with mint chutney and a lemon wedge; giant fingers break one open to show the steaming vegetable center.',
        hand:
          'Giant fingers break a pakora, dip it into chutney, and set it back with a final squeeze of lemon.',
        motion:
          'The pakora crackles open; steam escapes, chutney clings, lemon mist falls, and the camera settles into a slow hero orbit.',
        state: 'finished pakoras plated with chutney, lemon and a broken-open piece',
        next: 'the final hero frame',
        focus: 'the crispy shell, steaming center and green chutney',
        camera: 'slow cinematic orbit with a focus pull to the broken pakora',
        sfx: [
          'pakora crack',
          'steam release',
          'chutney dip',
          'lemon squeeze',
          'courtyard birds',
        ],
        duration: 6,
        ingredients: 'pakoras, mint chutney, lemon',
      },
    ],
  },
  {
    id: 'tandoori-chicken',
    name: 'Tandoori Chicken',
    emoji: '🍗',
    cuisine: 'Pakistani & North Indian',
    complexity: 'medium',
    tagline: 'Smoky char, yogurt marinade, a glow from the clay oven.',
    blurb:
      'A miniature tandoori chicken leg, blistered over live coals in a clay tandoor and finished with butter and lemon.',
    keyIngredients: ['chicken leg', 'yogurt', 'tandoori masala', 'lemon'],
    ingredients: [
      'chicken leg',
      'yogurt',
      'tandoori masala',
      'ginger',
      'garlic',
      'lemon',
      'red chili',
      'garam masala',
      'butter',
      'onion',
      'mint chutney',
      'coriander',
    ],
    cookware: [
      'miniature clay tandoor',
      'iron skewer',
      'tiny basting brush',
      'terracotta serving plate',
    ],
    palette: ['#c2572f', '#d99b45', '#5e6b3e'],
    accent: '#c2572f',
    tags: ['tandoor', 'charred', 'smoky'],
    stages: [
      {
        name: 'Yogurt Marinade',
        visual:
          'A tiny chicken leg rests in a clay bowl of thick yogurt stained red with tandoori masala; ginger and lemon are pressed into the cuts.',
        hand:
          'Giant fingers score the chicken lightly, then massage the red marinade into every slit.',
        motion:
          'The marinade is worked into the chicken; yogurt clings, lemon juice drips, and the camera orbits the bowl.',
        state: 'chicken leg coated in a deep red tandoori yogurt marinade',
        next: 'the chicken resting while the tandoor heats',
        focus: 'the red marinade, scored skin and lemon drip',
        camera: 'slow macro orbit around the clay bowl',
        sfx: [
          'yogurt massage',
          'chicken turn',
          'lemon drip',
          'fire crackle',
        ],
        duration: 5,
        ingredients: 'chicken leg, yogurt, tandoori masala, ginger, lemon',
      },
      {
        name: 'Spice Rub',
        visual:
          'Extra garam masala and red chili are rubbed over the marinated chicken; the surface darkens and the skin glistens.',
        hand:
          'Giant fingers press the dry spices into the marinade, then smooth the coating over the skin.',
        motion:
          'The rub is pressed in; spice dust settles, the chicken is turned, and the camera pushes in on the textured surface.',
        state: 'chicken leg with a thick red spice rub over the yogurt marinade',
        next: 'the chicken being threaded onto the iron skewer',
        focus: 'the spice crust, yogurt streaks and scored skin',
        camera: 'tight macro push-in',
        sfx: [
          'spice rub',
          'chicken press',
          'dry spice falling',
          'tandoor fire',
        ],
        duration: 4,
        ingredients: 'chicken leg, garam masala, red chili, tandoori masala',
      },
      {
        name: 'Thread the Skewer',
        visual:
          'A small iron skewer runs through the chicken leg; the metal glints and the chicken hangs ready above the clay tandoor.',
        hand:
          'Giant fingers guide the skewer through the meat, then hold the chicken above the glowing tandoor mouth.',
        motion:
          'The skewer pierces the chicken; the leg is lifted, turned once, and lowered toward the tandoor heat.',
        state: 'chicken leg threaded on an iron skewer above the clay tandoor',
        next: 'the chicken descending into the tandoor',
        focus: 'the iron skewer, red chicken and glowing tandoor mouth',
        camera: 'slow macro tilt down into the tandoor',
        sfx: [
          'skewer pierce',
          'metal tap',
          'tandoor fire roar',
          'hot air',
        ],
        duration: 4,
        ingredients: 'chicken leg, iron skewer',
      },
      {
        name: 'Into the Tandoor',
        visual:
          'The chicken is lowered into the clay tandoor; orange coals glow below and heat haze distorts the edges of the frame.',
        hand:
          'Giant fingers hold the skewer and set it into the tandoor, then adjust the coals with a small iron poker.',
        motion:
          'The chicken descends; flames flare, smoke rises, and the camera stays low as heat shimmer crosses the lens.',
        state: 'chicken cooking inside a glowing clay tandoor, smoke rising',
        next: 'the charred chicken being lifted from the tandoor',
        focus: 'the glowing coals, heat haze and red chicken',
        camera: 'low macro through heat shimmer',
        sfx: [
          'tandoor fire',
          'fat dripping on coals',
          'skewer settle',
          'roaring flame',
        ],
        duration: 5,
        ingredients: 'chicken leg, tandoor coals',
      },
      {
        name: 'Char & Blister',
        visual:
          'The chicken emerges blistered and charred at the edges; smoke clings to the skin and the red marinade has darkened to a deep brick color.',
        hand:
          'Giant fingers turn the skewer, inspecting the char, then brush away a loose fleck of burnt spice.',
        motion:
          'The skewer rotates; smoke curls, the charred skin crackles, and the camera orbits the chicken close-up.',
        state: 'charred, blistered tandoori chicken on the skewer',
        next: 'butter and lemon being applied',
        focus: 'the charred spots, blistered skin and smoke',
        camera: 'slow macro orbit',
        sfx: [
          'charred skin crackle',
          'skewer turn',
          'smoke drift',
          'coal settle',
        ],
        duration: 5,
        ingredients: 'tandoori chicken, charred spices',
      },
      {
        name: 'Butter & Lemon',
        visual:
          'Melted butter is brushed over the hot chicken and a lemon half is squeezed; the skin shines and steam lifts from the surface.',
        hand:
          'Giant fingers brush butter across the chicken, then squeeze lemon over it from above.',
        motion:
          'Butter melts into the char; lemon mist falls, steam rises, and the camera follows the glossy drip down the skin.',
        state: 'tandoori chicken brushed with butter and lemon, glistening',
        next: 'the chicken being plated with onion and chutney',
        focus: 'the butter gloss, lemon mist and charred skin',
        camera: 'slow macro push-in',
        sfx: [
          'butter brush',
          'lemon squeeze',
          'steam release',
          'tandoor crackle',
        ],
        duration: 4,
        ingredients: 'tandoori chicken, butter, lemon',
      },
      {
        name: 'Tandoori Hero',
        final: true,
        visual:
          'The final tandoori chicken sits on a terracotta plate with onion rings, mint chutney and lemon; giant fingers make a final adjustment to the charred leg.',
        hand:
          'Giant fingers place an onion ring, press a coriander leaf onto the chicken and squeeze one last drop of lemon.',
        motion:
          'Lemon falls; the chicken glistens, onion rings settle, and the camera begins a slow hero orbit.',
        state: 'finished tandoori chicken plated with onion, chutney and lemon',
        next: 'the final hero frame',
        focus: 'the charred skin, butter gloss and bright onion',
        camera: 'slow cinematic orbit with a shallow focus falloff',
        sfx: [
          'lemon squeeze',
          'onion placement',
          'plate settle',
          'tandoor embers',
          'courtyard birds',
        ],
        duration: 6,
        ingredients: 'tandoori chicken, onion, mint chutney, lemon, coriander',
      },
    ],
  },
  {
    id: 'daal-chawal',
    name: 'Daal Chawal',
    emoji: '🍚',
    cuisine: 'Pakistani & North Indian',
    complexity: 'simple',
    tagline: 'Golden daal, ghee tarka, a mountain of steamed rice.',
    blurb:
      'A miniature bowl of yellow daal over steamed basmati rice, finished with a sizzling ghee tarka.',
    keyIngredients: ['red lentils', 'basmati rice', 'ghee', 'cumin'],
    ingredients: [
      'red lentils',
      'basmati rice',
      'ghee',
      'cumin seeds',
      'garlic',
      'dried red chili',
      'turmeric',
      'coriander',
      'green chili',
      'lemon',
    ],
    cookware: [
      'miniature clay handi',
      'small iron tarka pan',
      'tiny brass ladle',
      'clay serving bowl',
    ],
    palette: ['#d9a441', '#f0e0b8', '#5e6b3e'],
    accent: '#d9a441',
    tags: ['comfort', 'vegetarian', 'rice'],
    stages: [
      {
        name: 'Rinse the Lentils',
        visual:
          'Red lentils sit in a clay bowl of clear water; giant fingers swirl them, and the water clouds slightly as the starch releases.',
        hand:
          'Giant fingers stir the lentils, lift a handful and let them fall back with a soft patter.',
        motion:
          'The lentils swirl; water clouds, a handful is lifted and released, and the camera pushes in on the orange grains.',
        state: 'rinsed red lentils in a clay bowl of water',
        next: 'the lentils going into the handi to boil',
        focus: 'the orange lentils, water ripples and giant fingertips',
        camera: 'slow macro push-in across the bowl',
        sfx: [
          'lentils swirled in water',
          'water patter',
          'clay bowl tap',
          'fire crackle',
        ],
        duration: 4,
        ingredients: 'red lentils, water',
      },
      {
        name: 'Boil & Haldi',
        visual:
          'Lentils bubble in a clay handi with turmeric; the water turns golden and the grains begin to soften and break down.',
        hand:
          'Giant fingers stir the daal with a brass ladle, then add a pinch of turmeric from a tiny bowl.',
        motion:
          'Turmeric clouds the water; the ladle stirs, bubbles rise, and the camera follows the golden color spreading.',
        state: 'red lentils simmering with turmeric in a clay handi',
        next: 'the tarka being prepared in a small iron pan',
        focus: 'the golden daal, soft bubbles and turmeric swirl',
        camera: 'low macro push-in through steam',
        sfx: [
          'daal simmering',
          'brass ladle stir',
          'turmeric sprinkle',
          'wood fire crackle',
        ],
        duration: 5,
        ingredients: 'red lentils, turmeric, water, salt',
      },
      {
        name: 'Ghee Tarka',
        visual:
          'Ghee melts in a tiny iron pan; cumin seeds, garlic and a dried red chili sizzle and darken, releasing a fragrant smoke.',
        hand:
          'Giant fingers tilt the pan and pour the sizzling tarka over the daal in a golden stream.',
        motion:
          'The tarka sputters; cumin pops, garlic turns golden, and the hot ghee pours into the daal with a loud sizzle.',
        state: 'sizzling ghee tarka with cumin, garlic and red chili poured into the daal',
        next: 'the daal being ladled over steamed rice',
        focus: 'the golden ghee, popping cumin and red chili',
        camera: 'slow macro tilt from pan to handi',
        sfx: [
          'ghee sizzle',
          'cumin popping',
          'tarka pour',
          'loud daal sizzle',
        ],
        duration: 5,
        ingredients: 'ghee, cumin seeds, garlic, dried red chili, daal',
      },
      {
        name: 'Steam the Rice',
        visual:
          'Basmati rice steams in a small clay pot; the lid is lifted and a cloud of steam reveals fluffy, separate grains.',
        hand:
          'Giant fingers lift the lid and fluff the rice with a brass fork, letting the steam escape.',
        motion:
          'The lid lifts; steam billows, the fork turns the rice, and the camera pushes through the haze to the grains.',
        state: 'steamed basmati rice fluffed in a clay pot',
        next: 'the rice being mounded in a serving bowl with daal',
        focus: 'the separate rice grains, steam and clay pot',
        camera: 'slow macro push-in through steam',
        sfx: [
          'clay lid lift',
          'steam release',
          'rice fluff',
          'brass fork tap',
        ],
        duration: 4,
        ingredients: 'basmati rice, water, salt',
      },
      {
        name: 'Ghee Hero',
        final: true,
        visual:
          'The final daal chawal is a hero: golden daal pooled over fluffy rice in a clay bowl, with a glossy ghee tarka, coriander and a lemon wedge; giant fingers add the last garnish.',
        hand:
          'Giant fingers spoon a little extra ghee over the daal, place coriander and squeeze lemon across the bowl.',
        motion:
          'Ghee melts into the daal; coriander settles, lemon mist falls, and the camera settles into a slow hero orbit.',
        state: 'finished daal chawal with ghee tarka, coriander and lemon',
        next: 'the final hero frame',
        focus: 'the golden daal, ghee sheen and fluffy rice',
        camera: 'slow cinematic orbit with a gentle push-in',
        sfx: [
          'ghee spoon',
          'coriander placement',
          'lemon squeeze',
          'clay bowl settle',
          'courtyard birds',
        ],
        duration: 6,
        ingredients: 'daal, rice, ghee, coriander, lemon',
      },
    ],
  },
  {
    id: 'fried-fish',
    name: 'Desi Fried Fish',
    emoji: '🐟',
    cuisine: 'Pakistani',
    complexity: 'medium',
    tagline: 'Ajwain-scented, gram-flour crisp, lemon bright.',
    blurb:
      'Miniature fish fillets marinated with ajwain and lemon, coated in gram flour and fried golden in a small karahi.',
    keyIngredients: ['fish', 'gram flour', 'ajwain', 'lemon'],
    ingredients: [
      'white fish fillet',
      'gram flour',
      'ajwain',
      'red chili',
      'turmeric',
      'lemon',
      'ginger garlic',
      'coriander',
      'chaat masala',
      'frying oil',
      'mint chutney',
      'green chili',
    ],
    cookware: [
      'miniature clay prep bowl',
      'small iron karahi',
      'tiny brass spider',
      'terracotta serving plate',
    ],
    palette: ['#d9a441', '#c2572f', '#6f8a4f'],
    accent: '#d9a441',
    tags: ['seafood', 'fried', 'crispy'],
    stages: [
      {
        name: 'Ajwain Marinade',
        visual:
          'Tiny fish fillets sit in a clay bowl with lemon, ajwain, turmeric and red chili; the marinade stains the fish a soft gold.',
        hand:
          'Giant fingers turn the fillets through the marinade, pressing lemon and spice into the flesh.',
        motion:
          'The fish turns; lemon juice glistens, ajwain seeds cling, and the camera orbits the bowl.',
        state: 'fish fillets coated in a golden ajwain-lemon marinade',
        next: 'the fillets being dredged in gram flour',
        focus: 'the fish flesh, ajwain seeds and lemon sheen',
        camera: 'slow macro orbit around the clay bowl',
        sfx: [
          'fish turn in marinade',
          'lemon drip',
          'clay bowl scrape',
          'fire crackle',
        ],
        duration: 5,
        ingredients: 'white fish, lemon, ajwain, turmeric, red chili, ginger garlic',
      },
      {
        name: 'Gram Flour Coat',
        visual:
          'The marinated fish is pressed into a shallow bowl of gram flour; a dry golden crust forms on both sides.',
        hand:
          'Giant fingers press the fish into the flour, flip it and shake off the excess.',
        motion:
          'The fillet is pressed and turned; flour clings, excess falls away, and the camera follows the coating.',
        state: 'gram-flour-coated fish fillets resting on a small board',
        next: 'the coated fillets going into the hot karahi',
        focus: 'the dry golden coating and flaking flour',
        camera: 'tight top-down macro',
        sfx: [
          'fish pressed into flour',
          'dry coating',
          'flour fall',
          'soft board tap',
        ],
        duration: 4,
        ingredients: 'fish fillets, gram flour, red chili, turmeric',
      },
      {
        name: 'Oil Heat',
        visual:
          'Oil shimmers in a small iron karahi; a single gram-flour crumb sizzles and rises, confirming the heat.',
        hand:
          'Giant fingers drop a pinch of gram flour into the oil and watch it sizzle.',
        motion:
          'The crumb hits; it bubbles, rises and spins, and the camera racks from the crumb to the shimmering oil.',
        state: 'hot oil shimmering in a small iron karahi, ready for frying',
        next: 'the fish fillet being lowered into the oil',
        focus: 'the sizzling crumb and trembling oil surface',
        camera: 'low macro slide along the karahi rim',
        sfx: [
          'oil shimmer',
          'flour crumb sizzle',
          'karahi heat',
          'fire crackle',
        ],
        duration: 4,
        ingredients: 'frying oil, gram flour',
      },
      {
        name: 'Golden Fry',
        visual:
          'The fish slides into the oil; a golden bubble ring forms and the gram-flour crust crisps to a deep amber.',
        hand:
          'Giant fingers lower the fillet with a brass spider, then spoon hot oil over the top.',
        motion:
          'The fish settles; oil bubbles, the crust darkens, and the camera pushes in through the steam.',
        state: 'fish frying golden in a small iron karahi',
        next: 'the fish being lifted and drained',
        focus: 'the crisp golden crust and bubbling oil',
        camera: 'low macro push-in through steam',
        sfx: [
          'fish frying',
          'oil bubbles',
          'hot oil basting',
          'brass spider tap',
        ],
        duration: 5,
        ingredients: 'coated fish, frying oil',
      },
      {
        name: 'Lemon & Chaat',
        visual:
          'The fried fish rests on a tiny rack; lemon juice is squeezed over the crust and a dusting of chaat masala lands on top.',
        hand:
          'Giant fingers squeeze lemon, then pinch chaat masala and let it fall over the fish.',
        motion:
          'Lemon mist settles; chaat masala dusts the crust, and the camera follows the droplets and spice falling.',
        state: 'fried fish with lemon and chaat masala on a wire rack',
        next: 'the fish being plated with chutney and green chili',
        focus: 'the lemon droplets, chaat dust and crisp crust',
        camera: 'slow macro push-in',
        sfx: [
          'lemon squeeze',
          'chaat masala dusting',
          'crust crackle',
          'rack settle',
        ],
        duration: 4,
        ingredients: 'fried fish, lemon, chaat masala',
      },
      {
        name: 'Mint Chutney Hero',
        final: true,
        visual:
          'The final fried fish sits on a terracotta plate with mint chutney, green chili and lemon; giant fingers break the crust to show the steaming white flesh.',
        hand:
          'Giant fingers break off a piece of fish, dip it into chutney and set it back on the plate.',
        motion:
          'The crust cracks; steam escapes, chutney clings, lemon glistens, and the camera settles into a slow hero orbit.',
        state: 'finished fried fish plated with chutney, green chili and lemon',
        next: 'the final hero frame',
        focus: 'the crisp crust, steaming white fish and green chutney',
        camera: 'slow cinematic orbit with a focus pull to the broken crust',
        sfx: [
          'fish crust crack',
          'steam release',
          'chutney dip',
          'plate settle',
          'courtyard birds',
        ],
        duration: 6,
        ingredients: 'fried fish, mint chutney, green chili, lemon',
      },
    ],
  },
  {
    id: 'jalebi',
    name: 'Jalebi',
    emoji: '🍯',
    cuisine: 'Pakistani & North Indian',
    complexity: 'medium',
    tagline: 'Golden spirals, syrup gloss, a shatter of pistachio.',
    blurb:
      'Miniature jalebi spirals fried in ghee and soaked in saffron syrup, finished with pistachio and silver leaf.',
    keyIngredients: ['flour', 'ghee', 'saffron syrup', 'pistachio'],
    ingredients: [
      'all-purpose flour',
      'yogurt',
      'saffron',
      'ghee',
      'sugar',
      'lemon',
      'cardamom',
      'pistachio',
      'rose water',
      'silver leaf',
    ],
    cookware: [
      'miniature clay mixing bowl',
      'small iron karahi',
      'tiny squeeze bottle',
      'brass serving plate',
    ],
    palette: ['#d9a441', '#c2572f', '#f0e0b8'],
    accent: '#d9a441',
    tags: ['dessert', 'sweet', 'fried'],
    stages: [
      {
        name: 'Ferment the Batter',
        visual:
          'A tiny clay bowl holds pale jalebi batter; bubbles rise through the surface and a saffron thread sits on top.',
        hand:
          'Giant fingers stir the batter once, then cover the bowl with a small cloth.',
        motion:
          'The batter is stirred; bubbles break, saffron turns, and the camera pushes in on the living surface.',
        state: 'fermenting jalebi batter with bubbles and saffron in a clay bowl',
        next: 'the batter resting while the syrup heats',
        focus: 'the bubbly batter, saffron thread and clay texture',
        camera: 'slow macro push-in',
        sfx: [
          'batter stir',
          'bubble pop',
          'cloth settle',
          'fire crackle',
        ],
        duration: 4,
        ingredients: 'all-purpose flour, yogurt, saffron, water',
      },
      {
        name: 'Ghee Heat',
        visual:
          'Ghee shimmers in a small iron karahi; its golden surface trembles and a faint ripple crosses the pan.',
        hand:
          'Giant fingers hold a tiny thermometer in the ghee, then lift it and nod to the camera.',
        motion:
          'The thermometer dips; ghee ripples, heat haze rises, and the camera glides along the golden surface.',
        state: 'hot golden ghee shimmering in a small iron karahi',
        next: 'the batter being piped into the ghee',
        focus: 'the golden ghee, fine ripples and heat haze',
        camera: 'low macro slide along the karahi rim',
        sfx: [
          'ghee shimmer',
          'tiny thermometer tap',
          'fire crackle',
          'soft heat hiss',
        ],
        duration: 4,
        ingredients: 'ghee',
      },
      {
        name: 'Spiral Pour',
        visual:
          'A tiny squeeze bottle pipes pale batter into the ghee; it spins into a spiral, puffs and turns golden at the edges.',
        hand:
          'Giant fingers squeeze the bottle in a steady spiral, then lift it away as the jalebi sets.',
        motion:
          'The batter coils into the ghee; the spiral grows, bubbles rise, and the camera follows the golden ring forming.',
        state: 'jalebi spiral frying in ghee, golden edges forming',
        next: 'the jalebi being turned for even color',
        focus: 'the batter spiral, bubbles and golden edges',
        camera: 'tight macro orbit above the karahi',
        sfx: [
          'batter squeeze',
          'ghee sizzle',
          'bubbles rising',
          'soft fire crackle',
        ],
        duration: 5,
        ingredients: 'jalebi batter, ghee',
      },
      {
        name: 'Golden Turn',
        visual:
          'The jalebi is flipped; both sides are deep gold and crisp, with syrup-ready ridges and a hollow center.',
        hand:
          'Giant fingers turn the spiral with brass tongs, then lift it to drain for a beat.',
        motion:
          'The spiral flips; ghee drips, the crisp surface crackles, and the camera follows the lift toward the syrup.',
        state: 'golden jalebi spiral lifted from the ghee, draining',
        next: 'the jalebi being dipped into saffron syrup',
        focus: 'the crisp golden spirals and dripping ghee',
        camera: 'slow macro tracking shot',
        sfx: [
          'jalebi flip',
          'ghee drip',
          'brass tongs tap',
          'crisp crackle',
        ],
        duration: 4,
        ingredients: 'jalebi, ghee',
      },
      {
        name: 'Syrup Soak',
        visual:
          'The jalebi is lowered into a tiny bowl of saffron-cardamom syrup; it hisses softly and absorbs the golden liquid.',
        hand:
          'Giant fingers hold the jalebi under the syrup for a beat, then lift it, letting a glossy strand drip back.',
        motion:
          'The spiral sinks; syrup bubbles at the edges, the jalebi turns glossy, and the camera follows the drip.',
        state: 'jalebi soaking in saffron syrup, glossy and golden',
        next: 'the jalebi being lifted onto a brass plate',
        focus: 'the amber syrup, glossy spiral and rising steam',
        camera: 'slow macro push-in',
        sfx: [
          'jalebi into syrup',
          'soft syrup hiss',
          'sticky drip',
          'brass bowl tap',
        ],
        duration: 5,
        ingredients: 'jalebi, saffron syrup, cardamom, rose water',
      },
      {
        name: 'Pistachio Finish',
        visual:
          'The syrup-soaked jalebi rests on a brass plate; crushed pistachio and a whisper of silver leaf are placed on top.',
        hand:
          'Giant fingers pinch pistachio and let it fall, then lay a tiny piece of silver leaf on the glossiest curve.',
        motion:
          'Pistachio scatters; silver leaf settles, syrup glints, and the camera pulls back to the plate.',
        state: 'jalebi on a brass plate with pistachio and silver leaf',
        next: 'the final hero stack and syrup drip',
        focus: 'the green pistachio, silver leaf and amber glaze',
        camera: 'slow overhead pull-back',
        sfx: [
          'pistachio falling',
          'silver leaf placement',
          'plate tap',
          'syrup settle',
        ],
        duration: 4,
        ingredients: 'jalebi, pistachio, silver leaf, saffron syrup',
      },
      {
        name: 'Jalebi Hero',
        final: true,
        visual:
          'The final jalebi is a hero: golden spirals stacked on a brass plate, dripping saffron syrup, crowned with pistachio and silver leaf; giant fingers lift one spiral.',
        hand:
          'Giant fingers lift a jalebi spiral, letting syrup stretch, then set it back and adjust the pistachio.',
        motion:
          'The spiral lifts; syrup stretches into a glossy thread, pistachio settles, and the camera begins a slow hero orbit.',
        state: 'finished jalebi stack with saffron syrup, pistachio and silver leaf',
        next: 'the final hero frame',
        focus: 'the glossy spirals, syrup thread and pistachio',
        camera: 'slow cinematic orbit with a focus pull to the syrup thread',
        sfx: [
          'jalebi lift',
          'syrup stretch',
          'pistachio settle',
          'plate tap',
          'courtyard birds',
        ],
        duration: 6,
        ingredients: 'jalebi, saffron syrup, pistachio, silver leaf',
      },
    ],
  },
];
