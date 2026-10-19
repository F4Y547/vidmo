import test from 'node:test';
import assert from 'node:assert/strict';

import { AUDIENCES, getAudience } from '../src/engine/audiences.js';
import {
  COMPLEXITY_RANGES,
  DISHES_BY_AUDIENCE,
  estimatedDuration,
  listDishes,
  validateDishLibrary,
} from '../src/engine/dishes/index.js';
import { analyzeCustomDish, planCustomDish } from '../src/engine/custom.js';
import { buildDishSelection, buildIdeaBoard, buildStoryboard, buildStageReroll } from '../src/engine/project.js';
import {
  buildMarkdown,
  buildRenderHandoff,
  buildShotListCsv,
} from '../src/engine/exports.js';
import { createZip } from '../src/server/zip.js';

const REQUIRED_IMAGE_PHRASES = [
  'extreme macro',
  'hyper-realistic miniature',
  'giant human hands compared to the tiny food',
  'tiny cookware',
  'shallow depth of field',
  'cinematic lighting',
  '8k ultra-detail',
  'professional food photography',
  'viral youtube shorts',
  'progression',
  'continuity lock',
];

const REQUIRED_AUDIO_RULES = [
  'no music',
  'no background music',
  'no songs',
  'no voiceover',
  'no dialogue',
  'no human speech',
  'only realistic asmr',
];

function buildProject(audienceId, dish) {
  return {
    id: `film_test_${audienceId}_${dish.id}`,
    audience: audienceId,
    dish,
  };
}

test('dish libraries are complete and complexity-accurate', () => {
  const issues = validateDishLibrary();
  assert.deepEqual(issues, []);
  for (const audienceId of Object.keys(AUDIENCES)) {
    const dishes = listDishes(audienceId);
    assert.equal(dishes.length, 10, `${audienceId} should offer exactly 10 ideas`);
    const ids = new Set(dishes.map((dish) => dish.id));
    assert.equal(ids.size, 10);
    for (const dish of dishes) {
      const range = COMPLEXITY_RANGES[dish.complexity];
      assert.ok(
        dish.stages.length >= range.min && dish.stages.length <= range.max,
        `${dish.name} stage count ${dish.stages.length} should fit ${dish.complexity}`,
      );
      const duration = estimatedDuration(dish.stages);
      assert.ok(duration >= 20 && duration <= 60, `${dish.name} runtime ${duration}s should be short-form friendly`);
    }
  }
});

test('idea board returns exactly 10 audience-appropriate ideas', () => {
  for (const audienceId of ['western', 'desi']) {
    const board = buildIdeaBoard(audienceId);
    assert.equal(board.ideas.length, 10);
    assert.equal(board.audience.id, audienceId);
    for (const idea of board.ideas) {
      assert.ok(idea.stageCount >= 3 && idea.stageCount <= 12);
      assert.ok(idea.estimatedDuration >= 20);
    }
  }
  const westernNames = buildIdeaBoard('western').ideas.map((idea) => idea.name);
  assert.ok(westernNames.includes('Fish & Chips'));
  const desiNames = buildIdeaBoard('desi').ideas.map((idea) => idea.name);
  assert.ok(desiNames.includes('Chicken Biryani'));
});

test('every library storyboard satisfies image, motion and audio locks', () => {
  for (const audienceId of ['western', 'desi']) {
    for (const dish of listDishes(audienceId)) {
      const storyboard = buildStoryboard({ project: buildProject(audienceId, dish) });
      assert.equal(storyboard.totalStages, dish.stages.length);
      assert.ok(storyboard.totalDuration >= 20 && storyboard.totalDuration <= 60);

      for (const [index, stage] of storyboard.stages.entries()) {
        const image = stage.imagePrompt.toLowerCase();
        const motion = stage.motionPrompt.toLowerCase();
        const audio = stage.audioPrompt.toLowerCase();

        for (const phrase of REQUIRED_IMAGE_PHRASES) {
          assert.ok(image.includes(phrase), `${dish.name} stage ${index + 1} missing image phrase "${phrase}"`);
        }
        for (const phrase of REQUIRED_AUDIO_RULES) {
          assert.ok(motion.includes(phrase), `${dish.name} stage ${index + 1} motion missing "${phrase}"`);
          assert.ok(audio.includes(phrase), `${dish.name} stage ${index + 1} audio missing "${phrase}"`);
        }
        assert.ok(stage.sfx.length >= 3, `${dish.name} stage ${index + 1} needs ASMR sfx`);
        assert.ok(stage.duration >= 3 && stage.duration <= 8);
        assert.equal(stage.compliance.passed, true, `${dish.name} stage ${index + 1} compliance failed: ${stage.compliance.missing.join(', ')}`);

        if (audienceId === 'desi') {
          assert.ok(!image.includes('gloves are allowed'), 'desi scenes must not allow gloves');
          assert.ok(image.includes('village courtyard'));
        } else {
          assert.ok(image.includes('modern backyard'));
        }
      }

      const finalStage = storyboard.stages.at(-1);
      assert.equal(finalStage.final, true);
      const finalImage = finalStage.imagePrompt.toLowerCase();
      for (const phrase of [
        'beautiful final plating',
        'professional garnish',
        'tiny serving plate',
        'giant human fingers',
        'hero',
      ]) {
        assert.ok(finalImage.includes(phrase), `${dish.name} final stage missing "${phrase}"`);
      }

      assert.equal(storyboard.audit.passed, true, `${dish.name} storyboard audit failed`);
      assert.equal(storyboard.audit.checks.find((check) => check.id === 'stage-range').pass, true);
      assert.equal(storyboard.audit.checks.find((check) => check.id === 'final-hero').pass, true);
      assert.equal(storyboard.audit.checks.find((check) => check.id === 'continuity').pass, true);
    }
  }
});

test('custom dish planner scales stage count to complexity', () => {
  const cases = [
    { name: 'Chicken Biryani', ingredients: 'rice, chicken, saffron, yogurt', audienceId: 'desi', expected: 'complex' },
    { name: 'Samosa', ingredients: 'flour, potato, peas, cumin', audienceId: 'desi', expected: 'complex' },
    { name: 'Pancakes', ingredients: 'flour, milk, egg, syrup', audienceId: 'western', expected: 'simple' },
    { name: 'Chicken Alfredo Pasta', ingredients: 'pasta, chicken, cream, parmesan', audienceId: 'western', expected: 'medium' },
    { name: 'Fish Curry', ingredients: 'fish, tomato, chili, coriander', audienceId: 'desi', expected: 'medium' },
    { name: 'Grilled Cheese Sandwich', ingredients: 'bread, cheddar, butter', audienceId: 'western', expected: 'simple' },
  ];
  for (const item of cases) {
    const analysis = analyzeCustomDish(item);
    assert.equal(analysis.complexity, item.expected, `${item.name} should be ${item.expected}`);
    const range = COMPLEXITY_RANGES[item.expected];
    assert.ok(analysis.stageCount >= range.min && analysis.stageCount <= range.max);

    const { dish } = planCustomDish(item);
    const storyboard = buildStoryboard({ project: buildProject(item.audienceId, dish) });
    assert.equal(storyboard.audit.passed, true, `${item.name} custom storyboard should pass audit`);
    assert.equal(storyboard.stages.at(-1).final, true);
  }
});

test('custom dishes never force exactly five stages', () => {
  const simple = planCustomDish({ name: 'Fruit Salad', ingredients: 'apple, banana, honey', audienceId: 'western' });
  const complex = planCustomDish({ name: 'Lamb Nihari', ingredients: 'lamb shank, nihari masala, ginger', audienceId: 'desi' });
  assert.notEqual(simple.dish.stages.length, complex.dish.stages.length);
  assert.ok(simple.dish.stages.length < complex.dish.stages.length);
});

test('dish selection respects the audience library', () => {
  const selection = buildDishSelection({ audienceId: 'desi', dishId: 'biryani' });
  assert.equal(selection.dish.name, 'Chicken Biryani');
  assert.equal(selection.analysis.source, 'library');
  assert.throws(() => buildDishSelection({ audienceId: 'desi', dishId: 'cheeseburger' }), /not in the/);
});

test('rerolling a stage keeps every lock intact', () => {
  const selection = buildDishSelection({ audienceId: 'western', dishId: 'cheeseburger' });
  const project = buildProject('western', selection.dish);
  const storyboard = buildStoryboard({ project });
  project.storyboard = storyboard;

  const before = storyboard.stages[2].imagePrompt;
  const reroll = buildStageReroll({ project, stageIndex: 2, variantSeed: 7 });
  assert.notEqual(before, reroll.stage.imagePrompt);
  for (const phrase of REQUIRED_IMAGE_PHRASES) {
    assert.ok(reroll.stage.imagePrompt.toLowerCase().includes(phrase));
  }
  const rerolledAudit = reroll.audit.stages[2];
  assert.equal(rerolledAudit.passed, true);
  assert.equal(reroll.stages[0].imagePrompt, storyboard.stages[0].imagePrompt);
});

test('exports contain every production artifact and rule', () => {
  const selection = buildDishSelection({ audienceId: 'desi', dishId: 'karahi' });
  const project = {
    id: 'film_export',
    title: 'Chicken Karahi · Desi',
    audience: 'desi',
    dish: selection.dish,
    analysis: selection.analysis,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    storyboard: buildStoryboard({ project: buildProject('desi', selection.dish) }),
  };

  const markdown = buildMarkdown(project);
  assert.ok(markdown.includes('Continuity Bible'));
  assert.ok(markdown.includes('IMAGE PROMPT'));
  assert.ok(markdown.includes('MOTION PROMPT'));
  assert.ok(markdown.includes('AUDIO PROMPT'));
  assert.ok(markdown.includes('NO MUSIC. NO BACKGROUND MUSIC. NO SONGS. NO VOICEOVER. NO DIALOGUE. NO HUMAN SPEECH.'));
  assert.equal((markdown.match(/### STAGE /g) ?? []).length, selection.dish.stages.length);

  const csv = buildShotListCsv(project);
  const csvRows = csv.trim().split('\r\n');
  assert.equal(csvRows.length, selection.dish.stages.length + 1);
  assert.ok(csvRows[0].includes('image_prompt'));
  assert.ok(csvRows[0].includes('audio_prompt'));

  const handoff = buildRenderHandoff(project);
  assert.equal(handoff.schema, 'vidmo.render-handoff/v1');
  assert.equal(handoff.stages.length, selection.dish.stages.length);
  assert.equal(handoff.audioPolicy.music, false);
  assert.equal(handoff.audioPolicy.voiceover, false);
  assert.ok(handoff.stages[0].imageJob.prompt.includes('EXTREME MACRO'));
  assert.ok(handoff.stages[0].videoJob.prompt.includes('NO MUSIC'));
});

test('zip writer creates a valid archive', () => {
  const zip = createZip([
    { name: 'readme.txt', data: 'hello vidmo' },
    { name: 'nested/stage-01-image.txt', data: 'prompt content' },
  ]);
  assert.ok(Buffer.isBuffer(zip));
  assert.equal(zip.readUInt32LE(0), 0x04034b50);
  const eocdOffset = zip.length - 22;
  assert.equal(zip.readUInt32LE(eocdOffset), 0x06054b50);
  assert.equal(zip.readUInt16LE(eocdOffset + 10), 2);
});

test('audience profiles enforce cultural continuity rules', () => {
  const western = getAudience('western');
  const desi = getAudience('desi');
  assert.ok(/gardening gloves/i.test(western.gloveRule));
  assert.ok(/no gloves/i.test(desi.gloveRule));
  assert.ok(/village courtyard/i.test(desi.environment));
  assert.ok(/backyard/i.test(western.environment));
  assert.ok(desi.negative.includes('pork'));
  assert.ok(desi.negative.includes('alcohol'));
  assert.ok(DISHES_BY_AUDIENCE.desi.every((dish) => !/pork|bacon|wine|beer/i.test(dish.ingredients.join(' '))));
});
