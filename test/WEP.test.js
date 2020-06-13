import { testFiles } from './util.js';
import { WEP } from '../src/WEP.js';
import { Reader } from '../src/Reader.js';
import * as assert from 'assert';

testFiles({
  label: 'WEP',
  dir: 'data/OBJ',
  filter: (it) => it.match(/\.WEP$/),
  test: (file, buffer) => {
    const reader = new Reader(buffer);
    const it = new WEP(reader);
    it.read();
    it.build();

    for (const bone of it.bones) {
      assert.equal(bone.mode, 0);
      assert.equal(bone.bodyPartId, 0);
    }
  },
});
