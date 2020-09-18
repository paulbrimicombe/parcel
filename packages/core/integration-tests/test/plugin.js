// @flow

import assert from 'assert';
import path from 'path';
import {
  assertBundles,
  bundle,
  outputFS as fs,
  distDir,
  overlayFS,
} from '@parcel/test-utils';

describe('plugin', function() {
  it("continue transformer pipeline on type change that doesn't change the pipeline", async function() {
    await bundle(
      path.join(__dirname, '/integration/pipeline-type-change/index.ini'),
    );

    let output = await fs.readFile(path.join(distDir, 'index.txt'), 'utf8');
    assert.equal(
      output,
      `INPUT
parcel-transformer-a
parcel-transformer-b`,
    );
  });

  it('should allow optimizer plugins to change the output file type', async function() {
    await bundle(
      path.join(__dirname, '/integration/optimizer-changing-type/index.js'),
    );

    assert.deepEqual(fs.readdirSync(distDir), ['index.test']);
  });

  it('should allow resolver plugins to disable deferring', async function() {
    let b = await bundle(
      path.join(__dirname, '/integration/resolver-canDefer/index.js'),
      {mode: 'production'},
    );

    assertBundles(b, [
      {
        type: 'js',
        assets: ['index.js', 'index.js', 'a.js', 'b.js'],
      },
    ]);
  });

  it('invalidate the cache based on loadConfig in a packager', async function() {
    let fixture = path.join(__dirname, '/integration/packager-loadConfig');
    let entry = path.join(fixture, 'index.txt');
    let config = path.join(fixture, 'foo.config.json');
    let b = await bundle(entry, {
      inputFS: overlayFS,
      disableCache: false,
    });

    assert.strictEqual(
      await overlayFS.readFile(b.getBundles()[0].filePath, 'utf8'),
      '1234',
    );

    await overlayFS.writeFile(config, JSON.stringify({contents: 'xyz'}));

    b = await bundle(entry, {
      inputFS: overlayFS,
      disableCache: false,
    });
    assert.strictEqual(
      await overlayFS.readFile(b.getBundles()[0].filePath, 'utf8'),
      'xyz',
    );
  });
});
