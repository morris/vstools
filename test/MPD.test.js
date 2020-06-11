import { testFiles } from './util.js';
import { MPD } from '../src/MPD.js';
import { Reader } from '../src/Reader.js';

testFiles({
  label: 'MPD',
  dir: 'data/MAP',
  filter: (it) => it.match(/\.MPD$/),
  test: (file, buffer) => {
    const reader = new Reader(buffer);
    const it = new MPD(reader);
    it.read();
  },
});
