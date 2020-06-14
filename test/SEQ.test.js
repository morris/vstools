import { testFiles, debugHtml, dumpReader, printResults } from './util.js';
import { SEQ } from '../src/SEQ.js';
import { Reader } from '../src/Reader.js';
import * as fs from 'fs';

testFiles({
  label: 'SEQ',
  dir: 'data/OBJ',
  filter: (it) => it.match(/\.SEQ$/) && it.match(/./),
  test: (file, buffer) => {
    const reader = new Reader(buffer);
    const it = new SEQ(reader);
    it.read();
    it.build();

    fs.writeFileSync(`debug/${file}.html`, debugHtml(file, dumpReader(reader)));
  },
});

printResults();
