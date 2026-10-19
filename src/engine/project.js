import { getAudience } from './audiences.js';
import {
  COMPLEXITY_RANGES,
  dishSummary,
  estimatedDuration,
  getDish,
  listDishes,
} from './dishes/index.js';
import { planCustomDish } from './custom.js';
import {
  auditStage,
  auditStoryboard,
  buildContinuityBible,
  buildNegativePrompt,
  buildProductionNotes,
  buildSocialPack,
  buildStageAudioPrompt,
  buildStageImagePrompt,
  buildStageMotionPrompt,
  buildThumbnailPrompt,
} from './prompts.js';

export function buildIdeaBoard(audienceId) {
  const audience = getAudience(audienceId);
  return {
    audience: {
      id: audience.id,
      option: audience.option,
      label: audience.label,
      shortLabel: audience.shortLabel,
      region: audience.region,
      tagline: audience.tagline,
      description: audience.description,
      environmentShort: audience.environmentShort,
      handsShort: audience.handsShort,
      palette: audience.palette,
    },
    ideas: listDishes(audienceId).map(dishSummary),
  };
}

export function buildDishSelection({ audienceId, dishId, customDish }) {
  const audience = getAudience(audienceId);

  if (dishId === 'custom' || customDish) {
    const customName = typeof customDish === 'object' ? customDish.name : customDish;
    const customIngredients = typeof customDish === 'object' ? customDish.ingredients : '';
    const { dish, analysis } = planCustomDish({
      name: customName,
      ingredients: customIngredients,
      audienceId,
    });
    return {
      dish,
      analysis: {
        ...analysis,
        audience: audience.label,
        source: 'custom',
        estimatedDuration: estimatedDuration(dish.stages),
      },
    };
  }

  const dish = getDish(audienceId, dishId);
  if (!dish) {
    const error = new Error(`Dish "${dishId}" is not in the ${audience.label} idea board`);
    error.statusCode = 404;
    throw error;
  }
  const range = COMPLEXITY_RANGES[dish.complexity];
  return {
    dish,
    analysis: {
      complexity: dish.complexity,
      complexityLabel: range.label,
      category: 'library',
      stageCount: dish.stages.length,
      estimatedDuration: estimatedDuration(dish.stages),
      rationale: `${range.label} · ${dish.stages.length} stages · ${dish.tagline}`,
      score: null,
      source: 'library',
      audience: audience.label,
    },
  };
}

export function buildStoryboard({ project, variantSeed = 0 }) {
  const audience = getAudience(project.audience);
  const dish = project.dish;
  const rawStages = dish.stages;
  const total = rawStages.length;

  const stages = rawStages.map((rawStage, index) => {
    const previousState = index > 0 ? rawStages[index - 1].state : null;
    const stage = {
      ...rawStage,
      id: `S${String(index + 1).padStart(2, '0')}`,
      previousState,
    };
    stage.imagePrompt = buildStageImagePrompt({
      audienceId: project.audience,
      dish,
      stage,
      index,
      total,
      seed: `${project.id}:${variantSeed}`,
    });
    stage.motionPrompt = buildStageMotionPrompt({
      audienceId: project.audience,
      dish,
      stage,
      index,
      total,
      seed: `${project.id}:${variantSeed}`,
    });
    stage.audioPrompt = buildStageAudioPrompt({
      audienceId: project.audience,
      dish,
      stage,
      index,
    });
    stage.negativePrompt = buildNegativePrompt(project.audience);
    stage.compliance = auditStage({
      audienceId: project.audience,
      dish,
      stage,
      index,
      total,
    });
    return stage;
  });

  const continuity = buildContinuityBible(project.audience, dish);
  const social = buildSocialPack(project.audience, dish);
  const production = buildProductionNotes(project.audience, dish);
  const negativePrompt = buildNegativePrompt(project.audience);
  const thumbnailPrompt = buildThumbnailPrompt({
    audienceId: project.audience,
    dish,
    seed: `${project.id}:${variantSeed}`,
  });
  const audit = auditStoryboard({
    audienceId: project.audience,
    dish,
    stages,
  });

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    audience: audience.label,
    audienceId: audience.id,
    dishName: dish.name,
    complexity: dish.complexity,
    complexityLabel: COMPLEXITY_RANGES[dish.complexity].label,
    totalStages: stages.length,
    totalDuration: stages.reduce((sum, stage) => sum + (stage.duration || 5), 0),
    aspect: audience.aspect,
    variantSeed,
    stages,
    continuity,
    negativePrompt,
    thumbnailPrompt,
    social,
    production,
    audit,
    summary: {
      scale: '1:12 miniature',
      hands: audience.handsShort,
      environment: audience.environmentShort,
      palette: audience.paletteText,
      audio: 'ASMR only — no music, no voiceover',
    },
  };
}

export function buildStageReroll({ project, stageIndex, variantSeed }) {
  const fresh = buildStoryboard({ project, variantSeed });
  const target = fresh.stages[stageIndex];
  if (!target) {
    const error = new Error(`Stage ${stageIndex + 1} does not exist`);
    error.statusCode = 404;
    throw error;
  }
  const stages = project.storyboard.stages.map((stage, index) =>
    index === stageIndex ? target : stage,
  );
  const audit = auditStoryboard({
    audienceId: project.audience,
    dish: project.dish,
    stages,
  });
  const stageAudit = auditStage({
    audienceId: project.audience,
    dish: project.dish,
    stage: target,
    index: stageIndex,
    total: stages.length,
  });
  return {
    stage: { ...target, compliance: stageAudit },
    audit,
    stages,
  };
}

export function buildProjectTitle(project) {
  if (!project?.dish) return 'Untitled miniature film';
  const audience = getAudience(project.audience);
  return `${project.dish.name} · ${audience.shortLabel}`;
}
