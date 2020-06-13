import { testFiles, debugHtml, dumpReader } from './util.js';
import { SEQ } from '../src/SEQ.js';
import { Reader } from '../src/Reader.js';
import * as fs from 'fs';

testFiles({
  label: 'SEQ',
  dir: 'data/OBJ',
  filter: (it) => it.match(/\.SEQ$/),
  test: (file, buffer) => {
    const reader = new Reader(buffer);
    const it = new SEQ(reader);
    it.read();

    fs.writeFileSync(`debug/${file}.html`, debugHtml(file, dumpReader(reader)));
  },
});
