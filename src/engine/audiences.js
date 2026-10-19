/**
 * Audience profiles are the continuity DNA of every project.
 * Every prompt is assembled from these locked values so the audience,
 * environment, hands, cookware and light never drift between stages.
 */

export const AUDIENCES = {
  western: {
    id: 'western',
    option: 'A',
    label: 'English-Speaking West',
    shortLabel: 'Western',
    region: 'USA · UK · Canada · Australia · Europe',
    tagline: 'Backyard heat. Modern tools. Golden-hour crunch.',
    description:
      'A sunlit modern backyard miniature set with clean Western hands, contemporary cookware and craveable pub-food plating.',
    surface: 'a weathered teak tabletop',
    environment:
      'a modern backyard outdoor kitchen with cedar decking, a charcoal grill with glowing embers, potted rosemary and basil, folded linen and soft green foliage bokeh',
    environmentShort: 'modern backyard · teak tabletop',
    tableProps:
      'a folded charcoal linen napkin, a tiny pepper mill, a small enamel tray and scattered fresh herbs',
    cookware: [
      'miniature matte-black cast-iron skillet',
      'tiny brushed-steel saucepan',
      'mini copper sauté pan',
      'small enameled Dutch oven',
      'tiny wire fry basket',
    ],
    cookwareFamily:
      'tiny matte-black cast iron, brushed steel and copper cookware with real wear, seasoning and contact shadows',
    hands:
      'clean full-size Western hands with warm fair-to-olive skin, short neat nails, visible pores, fine knuckle creases and natural fingerprint ridges',
    handsShort: 'clean Western hands',
    gloveRule:
      'Gardening gloves are allowed only for hot grill or oven moments: one matte charcoal-gray glove on the working hand. All clean prep is bare-handed.',
    gloves:
      'For hot grill work, the working hand wears a matte charcoal-gray gardening glove; the other hand stays bare. Never use gloves for clean prep.',
    lighting:
      'late-afternoon golden-hour side light raking across the table, a warm 3200K charcoal glow from below, soft atmospheric haze and deep cinematic falloff',
    colorGrade:
      'warm amber highlights, sage greens, creamy neutrals, deep teal shadows and gentle filmic contrast',
    lens: '100mm macro lens at f/2.8 with creamy shallow depth of field',
    aspect: '9:16 vertical',
    plating:
      'modern matte ceramic, dark slate, linen, micro-herbs and a restrained fine-dining garnish',
    palette: ['#e0a458', '#8a9a5b', '#f0e6d2', '#2f2a25', '#6b7f86'],
    paletteText: 'amber, sage, cream, charcoal and muted teal',
    ambience:
      'distant backyard birds, a light breeze through leaves and a faint charcoal crackle',
    negative: [
      'traditional South Asian village courtyard',
      'clay chulha',
      'terracotta handi',
      'desi masala piles',
      'gloves on clean prep hands',
      'banana leaf plating',
    ],
    audienceNotes:
      'Western pub, diner and backyard food language. Familiar comfort dishes, modern cookware and clean plating.',
    cardRules: [
      { icon: '🌿', label: 'Environment', value: 'Modern backyard · teak tabletop · cedar deck' },
      { icon: '✋', label: 'Hands', value: 'Clean Western hands · gardening gloves allowed for hot grill work' },
      { icon: '🍳', label: 'Cookware', value: 'Miniature cast iron · brushed steel · copper' },
      { icon: '🔊', label: 'Sound', value: 'ASMR only — no music, no voice, no dialogue' },
    ],
    hashtags: [
      '#miniaturecooking',
      '#tinyfood',
      '#asmrcooking',
      '#foodasmr',
      '#miniaturekitchen',
      '#shorts',
      '#reels',
      '#satisfying',
    ],
    suggestedTitles: [
      'Tiny Fish & Chips That Look Dangerously Real',
      'Cooking a Full Meal in a Miniature Backyard',
      'The Most Satisfying Mini Cheeseburger You Will See Today',
    ],
  },
  desi: {
    id: 'desi',
    option: 'B',
    label: 'Indian & Pakistani Audience',
    shortLabel: 'Desi',
    region: 'India · Pakistan · South Asia',
    tagline: 'Village fire. Clay hands. Soul-food cinema.',
    description:
      'A rustic village courtyard diorama with bare South Asian hands, clay cookware, live fire and deeply familiar desi comfort food.',
    surface: 'a swept-earth courtyard platform',
    environment:
      'a rustic South Asian village courtyard with a miniature clay chulha and live wood fire, an aged brick stove, copper pots, marigold garlands, a charpai and hens softly blurred in the bokeh',
    environmentShort: 'village courtyard · clay chulha',
    tableProps:
      'a tiny brass lota, scattered whole spices, a small clay bowl of ghee, marigold petals and a folded cotton cloth',
    cookware: [
      'miniature terracotta handi',
      'tiny clay tawa',
      'small black iron karahi',
      'brass ladle',
      'tiny clay serving bowl',
    ],
    cookwareFamily:
      'tiny terracotta, clay and black iron cookware with soot, patina and honest handmade texture',
    hands:
      'bare full-size South Asian hands with warm brown skin, natural pores, deep knuckle creases, short unpainted nails and a thin red thread tied on the right wrist',
    handsShort: 'bare South Asian hands',
    gloveRule:
      'No gloves at any stage. Bare realistic South Asian hands only, with natural skin texture and a consistent red thread on the right wrist.',
    gloves: 'No gloves. Bare hands only.',
    lighting:
      'warm dawn light mixed with orange chulha fire glow, gentle wood-smoke haze, earthy shadows and a cinematic rim light',
    colorGrade:
      'saffron, terracotta, deep maroon, brass highlights, smoky greens and rich filmic contrast',
    lens: '100mm macro lens at f/2.8 with a shallow, creamy depth of field',
    aspect: '9:16 vertical',
    plating:
      'a tiny terracotta plate with a banana-leaf liner, a small brass thali, fresh coriander, fried green chili and a ghee sheen',
    palette: ['#e2583e', '#d99b45', '#8f3b2e', '#4d5a3a', '#e8d8b8'],
    paletteText: 'saffron, terracotta, maroon, brass and smoky green',
    ambience:
      'distant courtyard birds, a soft breeze, faint wood-fire crackle and faraway village life',
    negative: [
      'gloves',
      'modern stainless-steel appliances',
      'Western backyard',
      'teak deck',
      'banana leaf is allowed but Western slate plating is not',
      'pork',
      'alcohol',
      'wine',
    ],
    audienceNotes:
      'South Asian comfort-food language. Familiar masalas, clay cookware, open fire and generous, soulful plating. Halal-friendly, no pork or alcohol.',
    cardRules: [
      { icon: '🔥', label: 'Environment', value: 'Village courtyard · clay chulha · brick stove' },
      { icon: '✋', label: 'Hands', value: 'Bare South Asian hands · no gloves at any stage' },
      { icon: '🫖', label: 'Cookware', value: 'Miniature terracotta · clay · black iron' },
      { icon: '🔊', label: 'Sound', value: 'ASMR only — no music, no voice, no dialogue' },
    ],
    hashtags: [
      '#miniaturecooking',
      '#desifood',
      '#tinyfood',
      '#asmrcooking',
      '#foodasmr',
      '#desi',
      '#shorts',
      '#reels',
      '#satisfying',
    ],
    suggestedTitles: [
      'Tiny Biryani in a Village Courtyard',
      'Mini Chulha Cooking That Sounds Like Home',
      'The Most Satisfying Little Karahi Ever',
    ],
  },
};

export const AUDIENCE_LIST = Object.values(AUDIENCES);

export function getAudience(id) {
  const audience = AUDIENCES[id];
  if (!audience) throw new Error(`Unknown audience: ${id}`);
  return audience;
}
