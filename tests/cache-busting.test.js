import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const publicScreenshotsDir = path.join(process.cwd(), 'public', 'screenshots');

const files = fs.readdirSync(publicScreenshotsDir).filter((name) => name.endsWith('.jpg'));

const required = [
  'home1.jpg',
  'home2.jpg',
  'home3.jpg',
  'historical.jpg',
  'download.jpg',
  'my_list.jpg',
  'settings.jpg',
  'planning.jpg',
];

test('all screenshot files exist in the public folder', () => {
  for (const name of required) {
    assert.ok(files.includes(name), `Missing screenshot: ${name}`);
  }
});

test('screenshots are served from a versioned URL pattern', () => {
  const code = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'Screenshots.astro'), 'utf8');
  const code2 = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'PhoneMockup.astro'), 'utf8');

  assert.match(code, /\?v=/m, 'Screenshots component should include a versioned query in its image URL');
  assert.match(code2, /\?v=/m, 'PhoneMockup component should include a versioned query in its image URL');
});
