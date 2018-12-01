const fs = require('fs');
const path = require('path');
const util = require('util');
const PNG = require('pngjs').PNG;
const VSTOOLS = require('./index');

async function run() {
  const filenames = await util.promisify(fs.readdir)('../vs/EFFECT');

  const fbcs = {};

  await Promise.all(filenames.map(async filename => {
    if (!filename.match(/\.FBC$/i)) return;

    const pat = path.join('../vs/EFFECT', filename);
    const buffer = await util.promisify(fs.readFile)(pat);
    const reader = new VSTOOLS.Reader(buffer);
    const fbc = new VSTOOLS.FBC(reader);
    fbc.read();
    fbcs[filename.replace(/_\d\.FBC/, '')] = fbc;
  }));

  await Promise.all(filenames.map(async filename => {
    if (!filename.match(/\.FBT$/i)) return;

    const pat = path.join('../vs/EFFECT', filename);
    const buffer = await util.promisify(fs.readFile)(pat);
    const reader = new VSTOOLS.Reader(buffer);
    const fbt = new VSTOOLS.FBT(reader, fbcs[filename.replace(/_\d\.FBT/i, '')]);
    fbt.read();

    const w = 128;
    const h = 256;

    var png = new PNG({
      width: fbt.image.width,
      height: fbt.image.height
    });

    png.data = fbt.image.data;
    png.pack()
      .pipe(fs.createWriteStream('export/effect/' + filename + '.png'))
      .on('finish', function() {

      });
  }));
}

run();
