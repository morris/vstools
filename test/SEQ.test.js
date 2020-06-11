import { testFiles } from './util.js';
import { SEQ } from '../src/SEQ.js';
import { Reader } from '../src/Reader.js';

testFiles({
  label: 'SEQ',
  dir: 'data/OBJ',
  filter: (it) => it.match(/\.SEQ$/),
  test: (file, buffer) => {
    const reader = new Reader(buffer);
    const it = new SEQ(reader);
    it.read();
  },
});
