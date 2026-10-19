import { getAudience } from './audiences.js';
import { COMPLEXITY_RANGES } from './dishes/index.js';

const TEXTURE_VARIANTS = [
  'microscopic oil beads, rising steam wisps and fine crumb detail',
  'tiny bubbles, glossy sauce highlights and floating flour motes',
  'crisp surface cracks, condensation droplets and soft smoke ribbons',
  'glistening fat, charred edges and delicate steam curls',
];

const CAMERA_VARIANTS = [
  'subtle breathing movement and natural handheld micro-drift',
  'slow parallax with a gentle rack focus',
  'smooth dolly move with a precise focus plane',
  'steady macro glide with a soft focus falloff',
];

const MOTION_VARIANTS = [
  'The motion is slow enough to read every texture change.',
  'Every contact point compresses naturally under the giant fingertips.',
  'The small scale reads clearly through weight, friction and steam.',
  'Liquid and crumb movement stay physically believable at 1:12 scale.',
];

function pad(number) {
  return String(number).padStart(2, '0');
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickVariant(array, seed, salt = 0) {
  const hash = hashString(`${seed}:${salt}`);
  return array[hash % array.length];
}

function sentence(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export function buildContinuityBible(audienceId, dish) {
  const audience = getAudience(audienceId);
  return {
    title: `${dish.name} — Continuity Bible`,
    audience: audience.label,
    scale:
      '1:12 tabletop miniature. The complete dish is smaller than a human fingertip; the cookware is tiny; the human hands are giant relative to the food.',
    hands: `${audience.hands}. ${audience.gloveRule}`,
    environment: audience.environment,
    surface: audience.surface,
    cookware: dish.cookware?.length ? dish.cookware.join(' · ') : audience.cookwareFamily,
    lighting: audience.lighting,
    lens: audience.lens,
    grade: audience.colorGrade,
    palette: audience.paletteText,
    plating: audience.plating,
    aspect: audience.aspect,
    sound: `ASMR only. ${audience.ambience}. No music, no background music, no songs, no voiceover, no dialogue, no human speech.`,
    camera:
      'Macro 100mm equivalent, locked 9:16 frame, slow cinematic moves, no cuts inside a shot, no scale changes, no character changes.',
    transition:
      'Each stage begins on the previous stage’s end frame. State, garnish position, cookware and hand placement must match across shots.',
    wardrobe:
      audience.id === 'desi'
        ? 'Bare hands only, thin red thread on the right wrist, no gloves, no nail polish.'
        : 'Clean bare hands for prep and plating. A single matte charcoal gardening glove may appear only for hot grill or oven work.',
  };
}

export function buildStageImagePrompt({ audienceId, dish, stage, index, total, seed = 'vidmo' }) {
  const audience = getAudience(audienceId);
  const stageNumber = index + 1;
  const previousState =
    index === 0
      ? 'the clean, untouched miniature set before the first cooking action'
      : stage.previousState || 'the previous stage’s finished frame';
  const progression =
    index === 0
      ? 'This opening frame establishes the set, scale, hands, ingredients and light for the entire film.'
      : `Progression from stage ${stageNumber - 1}: the scene advances from ${previousState} to ${stage.state}.`;
  const texture = pickVariant(TEXTURE_VARIANTS, seed, `${stageNumber}-texture`);
  const cameraTexture = pickVariant(CAMERA_VARIANTS, seed, `${stageNumber}-camera`);
  const cookware = dish.cookware?.length ? dish.cookware.slice(0, 4).join(', ') : audience.cookwareFamily;

  const finalBlock = stage.final
    ? `

FINAL HERO SHOT
Beautiful final plating on ${audience.plating}. The finished ${dish.name} is the undisputed hero: professional garnish, a tiny serving plate, mouth-watering macro food presentation and giant human fingers making the final adjustment. This is the most visually appealing, thumbnail-worthy frame of the entire sequence, with a clean hero composition and rich, appetizing detail.`
    : '';

  return `EXTREME MACRO PHOTOGRAPHY · STAGE ${pad(stageNumber)} OF ${pad(total)} · ${stage.name.toUpperCase()}

SCENE
Hyper-realistic miniature cooking of ${dish.name}, set on ${audience.surface} in ${audience.environment}. ${sentence(stage.visual)} ${sentence(stage.hand)}

SCALE & HANDS
Giant human hands compared to the tiny food: the hands are roughly 12× the height of the cookware and the entire dish is smaller than a fingertip. ${audience.hands}, with individual pores, fine creases, fingerprint ridges and natural nail texture visible. ${audience.gloveRule}

FOOD & PROPS
${sentence(stage.ingredients)} Prepared in ${cookware}. ${audience.tableProps}. Every ingredient, tool and technique is culturally accurate to ${dish.cuisine} cuisine and correct for this exact cooking stage. Realistic textures throughout: ${texture}, natural contact shadows and physically accurate crumbs, drips and steam.

PROGRESSION
Stage ${stageNumber} of ${total} — ${progression} Previous state: ${previousState}. This frame: ${stage.state}. Next moment: ${stage.next}.

CAMERA & LIGHT
${audience.lens}; shallow depth of field with creamy cinematic falloff and a tack-sharp focus on ${stage.focus}. Cinematic lighting: ${audience.lighting}. ${audience.colorGrade}. Vertical 9:16 composition, professional food photography framing, ${cameraTexture}.

FINISH
8K ultra-detail, hyper-realistic, physically accurate scale, natural contact shadows, subtle filmic grain and a viral YouTube Shorts / TikTok / Reels aesthetic. No text, no logos, no watermark, no plastic toy look.

CONTINUITY LOCK
Palette: ${audience.paletteText}. Environment: ${audience.environmentShort}. Hands: ${audience.handsShort}. Tiny cookware family: ${audience.cookwareFamily}. Same light direction, table surface, 1:12 scale and hand character in every stage.${finalBlock}`;
}

export function buildStageMotionPrompt({ audienceId, dish, stage, index, total, seed = 'vidmo' }) {
  const audience = getAudience(audienceId);
  const stageNumber = index + 1;
  const duration = stage.duration || 5;
  const motionNote = pickVariant(MOTION_VARIANTS, seed, `${stageNumber}-motion`);
  const endState = stage.final
    ? 'the finished hero frame, with the garnish and fingers settling into their final position'
    : stage.next;
  const sfx = stage.sfx.join(', ');

  return `MOTION · STAGE ${pad(stageNumber)}/${pad(total)} · ${stage.name} · ${duration}s · 9:16 · 24fps

START FRAME
Match the stage ${stageNumber} image exactly: ${stage.state}.

MOVEMENT (${duration} SECONDS)
${sentence(stage.motion)} The action begins on the current frame and resolves into ${endState}. Giant hands move with believable weight, friction and inertia; steam, oil, sauce, crumbs and gravity behave physically. ${motionNote} Maintain a constant 1:12 scale with no morphing, duplication, floating props or size drift. The tiny food stays smaller than a fingertip.

CAMERA
${sentence(stage.camera)}; smooth eased movement, subtle macro focus behavior, no cuts, no scene changes, no text overlays. Keep focus on ${stage.focus}. End on ${endState}.

CONTINUITY
Same ${audience.environmentShort}, same ${audience.handsShort}, same cookware family, same light direction, same palette and same table surface. No character, wardrobe or scale changes between stages.

AUDIO LOCK — ASMR ONLY
ONLY realistic ASMR sound effects synced to visible action: ${sfx}. Ambient bed: ${audience.ambience}, quiet and natural.
NO MUSIC. NO BACKGROUND MUSIC. NO SONGS. NO VOICEOVER. NO DIALOGUE. NO HUMAN SPEECH. No captions, no synthetic foley and no added sound design.`;
}

export function buildStageAudioPrompt({ audienceId, dish, stage, index }) {
  const audience = getAudience(audienceId);
  const stageNumber = index + 1;
  const sfx = stage.sfx.join(', ');

  return `AUDIO PROMPT · STAGE ${pad(stageNumber)} · ${stage.name}

ONLY REALISTIC ASMR SOUND EFFECTS, close-miked and physically synced to the picture: ${sfx}.
Ambient bed: ${audience.ambience}. Keep the ambience quiet, natural and outdoors.
NO MUSIC. NO BACKGROUND MUSIC. NO SONGS. NO VOICEOVER. NO DIALOGUE. NO HUMAN SPEECH. No captions, no synthetic foley.
STYLE: intimate ASMR food recording, 48kHz stereo, clean transients, detailed textures, natural dynamics, no added music or speech. The final mix should sound like a real miniature kitchen recorded with a close stereo pair.`;
}

export function buildNegativePrompt(audienceId) {
  const audience = getAudience(audienceId);
  const common = [
    'text',
    'letters',
    'watermark',
    'logo',
    'brand packaging',
    'captions',
    'UI overlay',
    'cartoon',
    'illustration',
    'CGI plastic toy',
    'dollhouse miniature',
    'oversaturated neon',
    'deformed hands',
    'extra fingers',
    'missing fingers',
    'fused fingers',
    'floating ingredients',
    'impossible physics',
    'scale inconsistency',
    'giant food',
    'miniature hands',
    'duplicate dishes',
    'motion blur on hero subject',
    'low resolution',
    'blurry',
    'plastic cookware',
    'empty plate',
    'extra arms',
    'cropped hands',
  ];
  const audienceSpecific = audience.negative;
  return [...new Set([...common, ...audienceSpecific])].join(', ');
}

export function buildThumbnailPrompt({ audienceId, dish, seed = 'vidmo' }) {
  const audience = getAudience(audienceId);
  const texture = pickVariant(TEXTURE_VARIANTS, seed, 'thumbnail');
  return `THUMBNAIL / COVER — ${dish.name.toUpperCase()}

Extreme macro hero cover image of the finished ${dish.name}, hyper-realistic miniature cooking at 1:12 scale, plated on ${audience.plating}. Professional garnish, glossy texture, visible steam and ${texture}. Giant human fingers enter from the edge, making a final adjustment and emphasizing the tiny scale. ${audience.hands}. ${audience.lighting}. ${audience.colorGrade}. Shallow depth of field, 100mm macro, cinematic food photography, 8K ultra-detail, vertical 9:16 with clean negative space in the upper third for a title overlay. No text, no logo, no watermark, no plastic toy look.`;
}

export function buildSocialPack(audienceId, dish) {
  const audience = getAudience(audienceId);
  const shortName = dish.name;
  const titles = [
    `Tiny ${shortName} in a Miniature ${audience.id === 'desi' ? 'Village Courtyard' : 'Backyard'}`,
    `Giant Hands vs. a Fingertip-Sized ${shortName}`,
    `The Most Satisfying Miniature ${shortName} You’ll See Today`,
    `A Whole ${shortName}, Cooked at 1:12 Scale`,
    `Would You Eat a ${shortName} This Small?`,
  ];
  const hooks = [
    `Tiny ${shortName}. Real fire. Real ASMR.`,
    'Wait for the final garnish.',
    'One bite is all you need.',
  ];
  const hashtags = audience.hashtags.join(' ');
  return {
    titles,
    hooks,
    caption: `A whole ${shortName} cooked at 1:12 scale in ${audience.environmentShort}. Giant hands, tiny cookware, real sounds. No music, no voiceover — just ASMR. ${hashtags}`,
    description: `Miniature ${shortName} made from scratch in a ${audience.environmentShort}. This is a ${dish.complexity} ${dish.stages.length}-stage miniature cooking film with realistic ASMR sound design. ${audience.hashtags.slice(0, 6).join(' ')}`,
    hashtags,
    platforms: {
      youtubeShorts: `Tiny ${shortName} 🌍🔥 Full ASMR miniature cook. ${audience.hashtags.slice(0, 4).join(' ')}`,
      tiktok: `${hooks[0]} ${audience.hashtags.slice(0, 5).join(' ')}`,
      instagramReels: `Miniature ${shortName}, macro detail, real kitchen sounds. ${audience.hashtags.slice(0, 5).join(' ')}`,
      facebookReels: `A fingertip-sized ${shortName}, made step by step. ${audience.hashtags.slice(0, 4).join(' ')}`,
    },
    thumbnailPrompt: buildThumbnailPrompt({ audienceId, dish }),
  };
}

export function buildProductionNotes(audienceId, dish) {
  const audience = getAudience(audienceId);
  return {
    imageModels: ['Midjourney v7', 'FLUX 1.1 Pro', 'Google Imagen 4', 'GPT Image'],
    videoModels: [
      {
        name: 'Google Veo 3.1',
        mode: 'Image-to-video + native audio',
        clip: '8s',
        note: 'Attach the stage image, paste the motion prompt, keep 9:16. Use the audio prompt for the sound bed and explicitly disable music.',
      },
      {
        name: 'Kling 2.5',
        mode: 'Image-to-video',
        clip: '5s / 10s',
        note: 'Use the stage image as the first frame. Favor the 5s mode for prep beats and 10s for the final hero. Add the ASMR bed in the edit.',
      },
      {
        name: 'Runway Gen-4',
        mode: 'Image-to-video',
        clip: '5s / 10s',
        note: 'Lock the camera move to the prompt. Generate the silent shot, then pair it with the stage audio prompt in post.',
      },
      {
        name: 'Sora 2',
        mode: 'Text/image-to-video',
        clip: 'Up to 10s',
        note: 'Paste the image and motion prompts together. Keep the audio lock paragraph verbatim so no music is generated.',
      },
    ],
    workflow: [
      `Generate all ${dish.stages.length} stage images first, using the same reference seed and the continuity bible.`,
      'Approve the final plating frame before generating any motion. It defines the visual target for the edit.',
      'Generate video stage by stage. Use each previous stage’s last frame as the next image reference where the tool supports it.',
      'Build the ASMR edit from the stage audio prompts, matching every sound to visible action. No music bed.',
      'Add silent text hooks in the edit if needed. Do not add voiceover or dialogue.',
      `Export ${audience.aspect} masters at 1080×1920 and a 4:5 or 1:1 cutdown for feed placements.`,
    ],
    checklist: [
      'Same 1:12 scale in every shot',
      'Same hand character, skin texture and wardrobe',
      'Same environment, table surface and light direction',
      'Same cookware family and plating language',
      'One clear visual progression per stage',
      'Final stage is the most appetizing hero frame',
      'Audio contains ASMR only: no music, no voice, no dialogue',
      'No on-screen text baked into generated footage',
    ],
    reference: {
      audience: audience.label,
      aspect: audience.aspect,
      lens: audience.lens,
      grade: audience.colorGrade,
      sound: 'Realistic ASMR only',
    },
  };
}

function requirement(id, label, pattern, target) {
  return { id, label, pass: pattern.test(target) };
}

export function auditStage({ audienceId, dish, stage, index, total }) {
  const image = (stage.imagePrompt ?? '').toLowerCase();
  const motion = (stage.motionPrompt ?? '').toLowerCase();
  const audio = (stage.audioPrompt ?? '').toLowerCase();
  const audience = getAudience(audienceId);

  const imageChecks = [
    requirement('macro', 'Extreme macro', /extreme macro/, image),
    requirement('miniature', 'Hyper-real miniature', /hyper-realistic miniature/, image),
    requirement('giant-hands', 'Giant hands vs tiny food', /giant human hands compared to the tiny food/, image),
    requirement('tiny-cookware', 'Tiny cookware', /tiny cookware/, image),
    requirement('scale', '1:12 scale', /1:12/, image),
    requirement('depth', 'Shallow depth of field', /shallow depth of field/, image),
    requirement('light', 'Cinematic lighting', /cinematic lighting/, image),
    requirement('detail', '8K ultra-detail', /8k ultra-detail/, image),
    requirement('pro', 'Professional food photography', /professional food photography/, image),
    requirement('shorts', 'Shorts aesthetic', /viral youtube shorts/, image),
    requirement('progression', 'Stage progression', /progression/, image),
    requirement('continuity', 'Continuity lock', /continuity lock/, image),
    requirement('dish', 'Dish named', new RegExp(escapeRegExp(dish.name.toLowerCase())), image),
  ];

  const motionChecks = [
    requirement('start-frame', 'Matches stage frame', /match the stage/, motion),
    requirement('asmr', 'ASMR only', /only realistic asmr/, motion),
    requirement('no-music', 'No music', /no music/, motion),
    requirement('no-bg-music', 'No background music', /no background music/, motion),
    requirement('no-songs', 'No songs', /no songs/, motion),
    requirement('no-voiceover', 'No voiceover', /no voiceover/, motion),
    requirement('no-dialogue', 'No dialogue', /no dialogue/, motion),
    requirement('no-speech', 'No human speech', /no human speech/, motion),
  ];

  const audioChecks = [
    requirement('audio-asmr', 'Audio is ASMR only', /only realistic asmr/, audio),
    requirement('audio-no-music', 'Audio has no music', /no music/, audio),
    requirement('audio-no-voiceover', 'Audio has no voiceover', /no voiceover/, audio),
    requirement('audio-no-dialogue', 'Audio has no dialogue', /no dialogue/, audio),
    requirement('audio-no-speech', 'Audio has no speech', /no human speech/, audio),
  ];

  const finalChecks = stage.final
    ? [
        requirement('final-plating', 'Final plating', /beautiful final plating/, image),
        requirement('final-garnish', 'Professional garnish', /professional garnish/, image),
        requirement('final-plate', 'Tiny serving plate', /tiny serving plate/, image),
        requirement('final-fingers', 'Final hand adjustment', /giant human fingers/, image),
        requirement('final-hero', 'Hero presentation', /hero/, image),
      ]
    : [];

  const allChecks = [...imageChecks, ...motionChecks, ...audioChecks, ...finalChecks];
  const passedChecks = allChecks.filter((check) => check.pass);
  const missing = allChecks.filter((check) => !check.pass);

  return {
    stageIndex: index,
    stageName: stage.name,
    passed: missing.length === 0,
    score: allChecks.length ? Math.round((passedChecks.length / allChecks.length) * 100) : 100,
    checks: allChecks,
    missing: missing.map((check) => check.label),
    environmentLocked: image.includes(audience.environmentShort.toLowerCase()),
    handsLocked: image.includes(audience.handsShort.toLowerCase()),
  };
}

export function auditStoryboard({ audienceId, dish, stages }) {
  const range = COMPLEXITY_RANGES[dish.complexity];
  const stageAudits = stages.map((stage, index) =>
    auditStage({ audienceId, dish, stage, index, total: stages.length }),
  );
  const failed = stageAudits.filter((audit) => !audit.passed);
  const finalStage = stages.at(-1);
  const finalAudit = stageAudits.at(-1);
  const checks = [
    {
      id: 'stage-range',
      label: `Stage count inside ${range.label.toLowerCase()} range (${range.min}–${range.max})`,
      pass: stages.length >= range.min && stages.length <= range.max,
    },
    {
      id: 'all-stage-locks',
      label: 'Every stage passes the image, motion and audio locks',
      pass: failed.length === 0,
    },
    {
      id: 'final-hero',
      label: 'Final stage is a plated hero with hand adjustment',
      pass: Boolean(finalStage?.final) && Boolean(finalAudit?.passed),
    },
    {
      id: 'continuity',
      label: 'Environment and hands stay locked across every stage',
      pass: stageAudits.every((audit) => audit.environmentLocked && audit.handsLocked),
    },
    {
      id: 'asmr',
      label: 'ASMR-only audio policy on every shot',
      pass: stages.every(
        (stage) =>
          /only realistic asmr/i.test(stage.motionPrompt) &&
          /no music/i.test(stage.motionPrompt) &&
          /no voiceover/i.test(stage.motionPrompt),
      ),
    },
    {
      id: 'seasoning',
      label: 'Ingredients and cooking stage are correctly referenced',
      pass: stages.every((stage) => {
        const prompt = stage.imagePrompt.toLowerCase();
        return stage.ingredients
          .toLowerCase()
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
          .some((item) => prompt.includes(item.split(' ').at(-1)));
      }),
    },
  ];
  return {
    passed: checks.every((check) => check.pass),
    score: Math.round(
      (stageAudits.reduce((sum, audit) => sum + audit.score, 0) / Math.max(stageAudits.length, 1) +
        (checks.filter((check) => check.pass).length / checks.length) * 100) /
        2,
    ),
    checks,
    stages: stageAudits,
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
