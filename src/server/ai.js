import { getAudience } from '../engine/audiences.js';
import { analyzeCustomDish } from '../engine/custom.js';
import { COMPLEXITY_RANGES } from '../engine/dishes/index.js';

const API_KEY = process.env.OPENAI_API_KEY || process.env.VIDMO_AI_API_KEY || '';
const BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const TIMEOUT_MS = 60_000;

export function getAiStatus() {
  let baseHost = 'api.openai.com';
  try {
    baseHost = new URL(BASE_URL).host;
  } catch {
    baseHost = 'invalid-base-url';
  }
  return {
    configured: Boolean(API_KEY),
    provider: 'OpenAI-compatible',
    model: MODEL,
    baseUrlHost: baseHost,
    mode: API_KEY ? 'ai-ready' : 'local',
    note: API_KEY
      ? 'Custom dishes can use the connected AI recipe planner. Storyboard prompts remain locked by the local prompt engine.'
      : 'Running fully locally. Set OPENAI_API_KEY to enable the optional custom-recipe planner.',
  };
}

const SYSTEM_PROMPT = `You are the recipe-planning director for a hyper-realistic miniature cooking video.
Return ONLY valid JSON. Do not include markdown, comments or extra text.

Your job is to break a user's dish into cinematic cooking stages. You do NOT write the final image/motion prompts; a separate locked prompt engine will do that. You only produce an accurate, sequential recipe plan.

JSON shape:
{
  "complexity": "simple" | "medium" | "complex",
  "rationale": "short reason for the chosen complexity",
  "stages": [
    {
      "name": "short stage title",
      "visual": "one or two sentences describing exactly what the camera sees in this stage",
      "hand": "one sentence describing what the giant human hands do",
      "motion": "one or two sentences describing natural movement from this stage to the next",
      "state": "the visible state at this exact frame",
      "next": "the visible state at the beginning of the next stage",
      "focus": "the single sharpest visual detail",
      "camera": "a specific macro camera move",
      "sfx": ["3-5 realistic ASMR sounds, no music"],
      "duration": 3-8,
      "ingredients": "comma-separated ingredients visible in this stage",
      "final": false
    }
  ]
}

RULES:
- Stage count MUST fit the declared complexity: simple 3-5, medium 5-8, complex 8-12.
- Use the real cooking technique for the dish. Do not invent impossible steps.
- The last stage MUST have "final": true and show beautiful final plating, the finished dish, professional garnish, a tiny serving plate and giant human fingers making a final adjustment. It must be the most visually appealing hero shot.
- Every stage must clearly progress from the previous one.
- The food is 1:12 miniature, the cookware is tiny, the human hands are giant relative to the food.
- sfx must be realistic ASMR only. Never include music, songs, voiceover, dialogue or human speech.
- Durations should total roughly 25-55 seconds.
- For Indian/Pakistani audiences: bare South Asian hands, village courtyard, clay/iron cookware, halal-friendly ingredients only (no pork, no alcohol).
- For Western audiences: clean Western hands, modern backyard, modern cookware; gardening gloves are allowed only for hot grill work.
- Ingredients must be accurate to the dish and the specific stage.`;

function parseIngredients(input) {
  if (Array.isArray(input)) return input.map((item) => String(item).trim()).filter(Boolean).slice(0, 24);
  if (!input) return [];
  return String(input)
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 24);
}

function safeJsonParse(text) {
  const cleaned = String(text ?? '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace < firstBrace) throw new Error('AI response did not contain JSON');
  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
}

async function requestCompletion(name, ingredients, audience) {
  const payload = {
    model: MODEL,
    temperature: 0.7,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Audience: ${audience.label} (${audience.region})
Dish: ${name}
Known ingredients (may be empty): ${ingredients.length ? ingredients.join(', ') : 'not provided'}
Environment: ${audience.environment}
Hands: ${audience.hands}
Cookware: ${audience.cookware.join(', ')}
Plating: ${audience.plating}

Plan this dish with the correct number of stages for its real complexity.`,
      },
    ],
    response_format: { type: 'json_object' },
  };

  const call = async (body) => {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return response;
  };

  let response = await call(payload);
  if (response.status === 400) {
    const { response_format, ...withoutFormat } = payload;
    response = await call(withoutFormat);
  }
  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`AI planner returned ${response.status}${details ? `: ${details.slice(0, 300)}` : ''}`);
  }
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI planner returned an empty response');
  return safeJsonParse(content);
}

function validatePlan(plan) {
  if (!plan || !Array.isArray(plan.stages)) throw new Error('AI plan is missing a stages array');
  const complexity = plan.complexity;
  const range = COMPLEXITY_RANGES[complexity];
  if (!range) throw new Error('AI plan has an invalid complexity');
  if (plan.stages.length < range.min || plan.stages.length > range.max) {
    throw new Error(
      `AI plan has ${plan.stages.length} stages, outside ${complexity} range ${range.min}-${range.max}`,
    );
  }
  if (plan.stages.length < 3) throw new Error('AI plan needs at least 3 stages');

  const stages = plan.stages.map((stage, index) => {
    if (!stage || typeof stage !== 'object') throw new Error(`AI stage ${index + 1} is invalid`);
    for (const field of ['name', 'visual', 'hand', 'motion', 'state', 'next', 'focus', 'ingredients']) {
      if (!stage[field] || typeof stage[field] !== 'string') {
        throw new Error(`AI stage ${index + 1} is missing "${field}"`);
      }
    }
    if (!Array.isArray(stage.sfx) || stage.sfx.length === 0) {
      throw new Error(`AI stage ${index + 1} needs ASMR sfx sounds`);
    }
    const duration = Number(stage.duration);
    return {
      name: stage.name.trim(),
      visual: stage.visual.trim(),
      hand: stage.hand.trim(),
      motion: stage.motion.trim(),
      state: stage.state.trim(),
      next: stage.next.trim(),
      focus: stage.focus.trim(),
      camera: String(stage.camera || 'slow macro push-in').trim(),
      sfx: stage.sfx.map((sound) => String(sound).trim()).filter(Boolean).slice(0, 6),
      duration: Number.isFinite(duration) ? Math.min(8, Math.max(3, Math.round(duration))) : 5,
      ingredients: stage.ingredients.trim(),
      final: index === plan.stages.length - 1,
    };
  });

  if (!stages.at(-1).final) {
    throw new Error('AI plan must end on a final stage');
  }
  return {
    complexity,
    rationale: String(plan.rationale || '').trim(),
    stages,
  };
}

const CATEGORY_EMOJI = {
  dessert: '🍯',
  rice: '🍛',
  noodle: '🍜',
  dough: '🥟',
  protein: '🍗',
  vegetable: '🥦',
  general: '🍽️',
};

export async function planCustomDishWithAI({ name, ingredients, audienceId }) {
  if (!API_KEY) throw new Error('AI planner is not configured');
  const cleanName = String(name ?? '').trim();
  if (!cleanName) throw new Error('A custom dish name is required');
  const audience = getAudience(audienceId);
  const parsedIngredients = parseIngredients(ingredients);

  const plan = validatePlan(await requestCompletion(cleanName, parsedIngredients, audience));
  const deterministicAnalysis = analyzeCustomDish({
    name: cleanName,
    ingredients: parsedIngredients,
    audienceId,
  });
  const cookware =
    audience.id === 'desi'
      ? audience.cookware[deterministicAnalysis.category === 'rice' ? 0 : 2] || audience.cookware[0]
      : audience.cookware[0];
  const dish = {
    id: `custom-${cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48)}`,
    name: cleanName,
    emoji: CATEGORY_EMOJI[deterministicAnalysis.category] || '🍽️',
    cuisine: audience.id === 'desi' ? 'Desi custom' : 'Western custom',
    complexity: plan.complexity,
    tagline: 'A custom miniature film, planned by the AI recipe director.',
    blurb: `An AI-planned ${plan.complexity} production for ${cleanName}, built for ${audience.label}.`,
    keyIngredients: parsedIngredients.slice(0, 4).length
      ? parsedIngredients.slice(0, 4)
      : [cleanName],
    ingredients: parsedIngredients,
    cookware: [cookware],
    palette: audience.palette,
    accent: audience.palette[0],
    tags: ['custom', deterministicAnalysis.category, 'ai-planned'],
    custom: true,
    aiPlanned: true,
    stages: plan.stages,
  };

  return {
    dish,
    analysis: {
      complexity: plan.complexity,
      complexityLabel: COMPLEXITY_RANGES[plan.complexity].label,
      category: deterministicAnalysis.category,
      stageCount: plan.stages.length,
      estimatedDuration: plan.stages.reduce((sum, stage) => sum + stage.duration, 0),
      rationale: plan.rationale || deterministicAnalysis.rationale,
      score: null,
      source: 'ai',
      audience: audience.label,
      model: MODEL,
    },
  };
}
