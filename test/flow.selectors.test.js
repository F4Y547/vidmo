import test from 'node:test';
import assert from 'node:assert/strict';

import { detectBlockingText } from '../src/server/flow/selectors.js';

// Regression guard for the Flow account menu: it renders the standard
// "This site is protected by reCAPTCHA..." footer. That is not a challenge and
// must not pause an otherwise healthy Flow session.
test('reCAPTCHA footer mentions are not treated as a challenge', () => {
  const footer =
    'Privacy · Terms of Service · Licences\nThis site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.';
  assert.equal(detectBlockingText(footer), null);
});

test('real Google challenges still pause Flow', () => {
  assert.equal(
    detectBlockingText('Please verify that you are human before continuing.').kind,
    'captcha',
  );
  assert.equal(detectBlockingText('Our systems have detected unusual traffic').kind, 'captcha');
  assert.equal(detectBlockingText("I'm not a robot").kind, 'captcha');
});

test('Flow failures and credit/sign-in states are classified', () => {
  assert.equal(
    detectBlockingText(
      'We noticed some unusual activity. Browser extensions that modify the page may cause issues.',
    ).kind,
    'failure',
  );
  assert.equal(detectBlockingText('You do not have enough credits for this generation.').kind, 'credits');
  assert.equal(detectBlockingText('Sign in to continue with Google Flow.').kind, 'signin');
  assert.equal(detectBlockingText('Something went wrong. Generation failed.').kind, 'failure');
});

test('normal studio copy does not trip the detectors', () => {
  assert.equal(
    detectBlockingText(
      '50 Google Flow credits. Credits refresh daily. Upgrade for more credits.',
    ),
    null,
  );
});
