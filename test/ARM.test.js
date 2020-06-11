import { testFiles } from './util.js';
import { ARM } from '../src/ARM.js';
import { Reader } from '../src/Reader.js';

testFiles({
  label: 'ARM',
  dir: 'data/SMALL',
  filter: (it) => it.match(/\.ARM$/),
  test: (file, buffer) => {
    const reader = new Reader(buffer);
    const it = new ARM(reader);
    it.read();
    it.build();
  },
});
