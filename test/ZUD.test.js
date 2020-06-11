import { testFiles } from './util.js';
import { ZUD } from '../src/ZUD.js';
import { Reader } from '../src/Reader.js';

testFiles({
  label: 'ZUD',
  dir: 'data/MAP',
  filter: (it) => it.match(/\.ZUD$/),
  test: (file, buffer) => {
    const reader = new Reader(buffer);
    const it = new ZUD(reader);
    it.read();
    it.build();
  },
});
