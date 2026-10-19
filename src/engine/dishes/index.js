import { WESTERN_DISHES } from './western.js';
import { DESI_DISHES } from './desi.js';

export const COMPLEXITY_RANGES = {
  simple: { min: 3, max: 5, label: 'Simple' },
  medium: { min: 5, max: 8, label: 'Medium' },
  complex: { min: 8, max: 12, label: 'Complex' },
};

export const DISHES_BY_AUDIENCE = {
  western: WESTERN_DISHES,
  desi: DESI_DISHES,
};

export function listDishes(audienceId) {
  const dishes = DISHES_BY_AUDIENCE[audienceId];
  if (!dishes) throw new Error(`No dish library for audience: ${audienceId}`);
  return dishes;
}

export function getDish(audienceId, dishId) {
  return listDishes(audienceId).find((dish) => dish.id === dishId) ?? null;
}

export function estimatedDuration(stages) {
  return stages.reduce((sum, stage) => sum + (stage.duration || 5), 0);
}

export function dishSummary(dish) {
  return {
    id: dish.id,
    name: dish.name,
    emoji: dish.emoji,
    cuisine: dish.cuisine,
    complexity: dish.complexity,
    complexityLabel: COMPLEXITY_RANGES[dish.complexity]?.label ?? dish.complexity,
    tagline: dish.tagline,
    blurb: dish.blurb,
    keyIngredients: dish.keyIngredients,
    cookware: dish.cookware,
    accent: dish.accent,
    palette: dish.palette,
    tags: dish.tags,
    stageCount: dish.stages.length,
    estimatedDuration: estimatedDuration(dish.stages),
  };
}

export function validateDishLibrary() {
  const issues = [];
  for (const [audienceId, dishes] of Object.entries(DISHES_BY_AUDIENCE)) {
    if (dishes.length !== 10) {
      issues.push(`${audienceId}: expected 10 dishes, found ${dishes.length}`);
    }
    const ids = new Set();
    for (const dish of dishes) {
      if (ids.has(dish.id)) issues.push(`${audienceId}: duplicate dish id "${dish.id}"`);
      ids.add(dish.id);

      const range = COMPLEXITY_RANGES[dish.complexity];
      if (!range) {
        issues.push(`${dish.id}: unknown complexity "${dish.complexity}"`);
        continue;
      }
      if (dish.stages.length < range.min || dish.stages.length > range.max) {
        issues.push(
          `${audienceId}/${dish.id}: ${dish.stages.length} stages is outside ${dish.complexity} range ${range.min}-${range.max}`,
        );
      }
      const finals = dish.stages.filter((stage) => stage.final);
      if (finals.length !== 1) {
        issues.push(`${dish.id}: expected exactly one final stage, found ${finals.length}`);
      }
      if (dish.stages.length && !dish.stages.at(-1).final) {
        issues.push(`${dish.id}: final stage must be last`);
      }
      for (const [index, stage] of dish.stages.entries()) {
        for (const key of [
          'name',
          'visual',
          'hand',
          'motion',
          'state',
          'next',
          'focus',
          'camera',
          'sfx',
          'duration',
          'ingredients',
        ]) {
          if (!stage[key] || (Array.isArray(stage[key]) && stage[key].length === 0)) {
            issues.push(`${dish.id} stage ${index + 1}: missing "${key}"`);
          }
        }
      }
    }
  }
  return issues;
}
