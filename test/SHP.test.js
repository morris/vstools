import { testFiles, debugHtml, dumpReader } from './util.js';
import { SHP } from '../src/SHP.js';
import { Reader } from '../src/Reader.js';
import * as fs from 'fs';

testFiles({
  label: 'SHP',
  dir: 'data/OBJ',
  filter: (it) => it.match(/\.SHP$/),
  test: (file, buffer) => {
    const reader = new Reader(buffer);
    const it = new SHP(reader);

    try {
      it.read();
      it.build();
    } finally {
      fs.writeFileSync(
        `debug/${file}.html`,
        debugHtml(file, dumpReader(reader))
      );
    }
  },
});
