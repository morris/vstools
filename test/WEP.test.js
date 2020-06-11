import { testFiles } from './util.js';
import { WEP } from '../src/WEP.js';
import { Reader } from '../src/Reader.js';

testFiles({
  label: 'WEP',
  dir: 'data/OBJ',
  filter: (it) => it.match(/\.WEP$/),
  test: (file, buffer) => {
    const reader = new Reader(buffer);
    const it = new WEP(reader);
    it.read();
    it.build();
  },
});
