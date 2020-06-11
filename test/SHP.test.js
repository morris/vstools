import { testFiles } from './util.js';
import { SHP } from '../src/SHP.js';
import { Reader } from '../src/Reader.js';

testFiles({
  label: 'SHP',
  dir: 'data/OBJ',
  filter: (it) => it.match(/\.SHP$/),
  test: (file, buffer) => {
    const reader = new Reader(buffer);
    const it = new SHP(reader);
    it.read();
    it.build();
  },
});
