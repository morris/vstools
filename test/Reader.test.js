import { Reader } from '../src/Reader.js';
import { test } from './util.js';
import * as assert from 'assert';

test({
  label: 'Reader',
  test() {
    const r1 = new Reader([1, 2, 3, 4]);
    assert.equal(r1.s32(), 67305985);

    const r2 = new Reader([0xff, 0xff, 0xff, 0xff]);
    assert.equal(r2.s32(), -1);
  },
});
