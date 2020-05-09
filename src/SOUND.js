// SOUND/WAVEXXXX.DAT

VSTOOLS.SOUND = function (reader) {
  reader.extend(this);
};

VSTOOLS.SOUND.prototype.read = function () {
  if (this.reader.length <= 1) return;

  this.header();
  this.articulationSection();
  this.sampleSection();

  VSTOOLS.assert(this.pos(), this.length);
};

VSTOOLS.SOUND.prototype.header = function () {
  var u8 = this.u8,
    s16 = this.s16,
    u16 = this.u16,
    u32 = this.u32;
  var assert = VSTOOLS.assert,
    hex = VSTOOLS.hex;

  assert(u32(), 0x4f414b41); // AKAO
  this.id = u16();
  assert(this.id <= 200);

  assert(u16(), 0);
  assert(u32(), 0);
  assert(u32(), 0);

  this.a = u8();
  this.b = u8();
  this.c = u8();
  assert(u8(), 0);

  //console.log( this.a, this.b, this.c );

  assert(this.a === 0 || this.a === 48);
  assert(this.b === 16 || this.b === 49 || this.b === 81);
  assert(this.c === 0 || this.c === 2 || this.c === 3);

  //console.log( this.a );

  this.sampleSectionSize = u32();
  assert(this.sampleSectionSize < this.reader.length);

  this.articulationFirstId = u32();
  this.articulationCount = u32();

  console.log(this.articulationCount);

  assert(
    this.articulationFirstId === 0 ||
      this.articulationFirstId === 32 ||
      this.articulationFirstId === 64
  );
  assert(
    this.articulationCount === 32 ||
      this.articulationCount === 48 ||
      this.articulationCount === 64
  );

  if (this.a === 48) this.articulationCount = 128;

  assert(u32(), 0);
  assert(u32(), 0);
  assert(u32(), 0);
  assert(u32(), 0);

  assert(u32(), 0);
  assert(u32(), 0);
  assert(u32(), 0);
  assert(u32(), 0);

  assert(this.pos(), 0x40);
};

VSTOOLS.SOUND.prototype.articulationSection = function () {
  var u8 = this.u8,
    s16 = this.s16,
    u16 = this.u16,
    u32 = this.u32;
  var assert = VSTOOLS.assert,
    hex = VSTOOLS.hex;

  this.articulations = [];
  for (var i = 0; i < this.articulationCount; ++i) {
    this.articulations.push(this.articulation(i));
  }
};

VSTOOLS.SOUND.prototype.articulation = function (i) {
  var u8 = this.u8,
    s16 = this.s16,
    u16 = this.u16,
    u32 = this.u32;
  var assert = VSTOOLS.assert,
    hex = VSTOOLS.hex;

  var articulation = {
    id: this.articulationFirstId + i,
    sampleOffset: u32(),
    loopPoint: u32(),
    fineTune: s16(),
    unityKey: u16(),
    adsr1: s16(),
    adsr2: s16(),
  };

  assert(articulation.sampleOffset <= articulation.loopPoint);

  return articulation;
};

VSTOOLS.SOUND.prototype.sampleSection = function () {
  var u8 = this.u8;
  this.seek(0x40 + this.articulationCount * 0x10);

  this.sampleOffsets = [];

  var j = 0;
  for (var i = this.pos(); i < this.length; ++i) {
    j = u8() === 0 ? j + 1 : 0;
    if (j >= 0x10) {
      this.sampleOffsets.push(this.pos() - j);
      j = 0;
    }
  }

  console.log(this.sampleOffsets);

  this.samples = [];

  for (var i = 0; i < this.sampleOffsets.length - 1; ++i) {
    this.seek(this.sampleOffsets[i]);
    this.samples.push(
      this.sample(
        (this.sampleOffsets[i + 1] || this.length) - this.sampleOffsets[i]
      )
    );
  }
};

VSTOOLS.SOUND.prototype.sample = function (size) {
  console.log(size);
  var u8 = this.u8,
    s8 = this.s8,
    u32 = this.u32;
  var assert = VSTOOLS.assert;

  assert(u32(), 0);
  assert(u32(), 0);
  assert(u32(), 0);
  assert(u32(), 0);

  var a = u8();
  var b = u8();

  var sample = {
    range: a & 0xf,
    filter: (a & 0xf0) >> 4,
    end: b & 0x1,
    looping: b & 0x2,
    loop: b & 0x4,
    data: [],
  };

  for (var i = 0; i < size - 18; ++i) {
    sample.data.push(s8());
  }

  return sample;
};

VSTOOLS.AdpcmCoeff = [
  [0.0, 0.0],
  [60.0 / 64.0, 0.0],
  [115.0 / 64.0, 52.0 / 64.0],
  [98.0 / 64.0, 55.0 / 64.0],
  [122.0 / 64.0, 60.0 / 64.0],
];

VSTOOLS.SOUND.prototype.sampleToWave = function (sample) {
  var i;
  var prev = { prev1: 0, prev2: 0 };
  var wave = [];
  for (i = 0; i < sample.samples.length; i++) {
    prev = decompressSample(sample.samples, prev.prev1, prev.prev2);
  }
  return wave;
};

// from https://github.com/vgmtrans/vgmtrans/blob/fe5b065ad7ebd2880b2428bd8a4fb485f63adf84/src/main/formats/PSXSPU.cpp
VSTOOLS.SOUND.prototype.decompressSample = function (sample, prev1, prev2) {
  var i;
  var t; // Temporary sample
  var f1, f2;
  var p1, p2;
  var coeff = VSTOOLS.AdpcmCoeff;

  var shift = sample.range + 16; // Shift amount for compressed samples

  var wave = (sample.wave = []);

  for (i = 0; i < 14; i++) {
    wave[i * 2] = (sample.data[i] << 28) >> shift;
    wave[i * 2 + 1] = ((sample.data[i] & 0xf0) << 24) >> shift;
  }

  // Apply ADPCM decompression
  i = sample.filter;

  if (i) {
    f1 = coeff[i][0];
    f2 = coeff[i][1];
    p1 = prev1;
    p2 = prev2;

    for (i = 0; i < 28; i++) {
      t = wave[i] + p1 * f1 - p2 * f2;
      wave[i] = t;
      p2 = p1;
      p1 = t;
    }

    prev1 = p1;
    prev2 = p2;
  } else {
    prev1 = wave[26];
    prev2 = wave[27];
  }

  return {
    prev1: prev1,
    prev2: prev2,
  };
};
