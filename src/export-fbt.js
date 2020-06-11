import * as fs from 'fs';
import * as path from 'path';
import pngjs from 'pngjs';
import { Reader } from './Reader.js';
import { FBC } from './FBC.js';
import { FBT } from './FBT.js';

const { PNG } = pngjs;

async function run() {
  const filenames = fs.readdirSync('./data/EFFECT');

  const fbcs = {};

  filenames.map(async (filename) => {
    if (!filename.match(/\.FBC$/i)) return;

    const pat = path.join('./data/EFFECT', filename);
    const buffer = fs.readFileSync(pat);
    const reader = new Reader(buffer);
    const fbc = new FBC(reader);
    fbc.read();
    fbcs[filename.replace(/_\d\.FBC/, '')] = fbc;
  });

  filenames.map((filename) => {
    if (!filename.match(/\.FBT$/i)) return;

    const pat = path.join('./data/EFFECT', filename);
    const buffer = fs.readFileSync(pat);
    const reader = new Reader(buffer);
    const fbt = new FBT(reader, fbcs[filename.replace(/_\d\.FBT/i, '')]);
    fbt.read();

    const png = new PNG({
      width: fbt.image.width,
      height: fbt.image.height,
    });

    png.data = fbt.image.data;
    png
      .pack()
      .pipe(fs.createWriteStream('export/effect/' + filename + '.png'))
      .on('finish', function () {});
  });
}

run();
