import { testFiles } from './util.js';
import { ZND } from '../src/ZND.js';
import { Reader } from '../src/Reader.js';

testFiles({
  label: 'ZND',
  dir: 'data/MAP',
  filter: (it) => it.match(/\.ZND$/),
  test: (file, buffer) => {
    const reader = new Reader(buffer);
    const it = new ZND(reader);
    it.read();
  },
});
