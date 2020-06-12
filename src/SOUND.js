// SOUND/WAVEXXXX.DAT
import { assert } from './VSTOOLS';

const AdpcmCoeff = [
  [0.0, 0.0],
  [60.0 / 64.0, 0.0],
  [115.0 / 64.0, 52.0 / 64.0],
  [98.0 / 64.0, 55.0 / 64.0],
  [122.0 / 64.0, 60.0 / 64.0],
];

export class SOUND {
  constructor(reader) {
    this.reader = reader;
  }

  read() {
    const r = this.reader;
    if (r.data.length <= 1) return;

    this.header();
    this.articulationSection();
    this.sampleSection();

    assert(r.pos, this.length);
  }

  header() {
    const r = this.reader;

    assert(r.u32(), 0x4f414b41); // AKAO
    this.id = r.u16();
    assert(this.id <= 200);

    assert(r.u16(), 0);
    assert(r.u32(), 0);
    assert(r.u32(), 0);

    this.a = r.u8();
    this.b = r.u8();
    this.c = r.u8();
    assert(r.u8(), 0);

    //console.log( this.a, this.b, this.c );

    assert(this.a === 0 || this.a === 48);
    assert(this.b === 16 || this.b === 49 || this.b === 81);
    assert(this.c === 0 || this.c === 2 || this.c === 3);

    //console.log( this.a );

    this.sampleSectionSize = r.u32();
    assert(this.sampleSectionSize < this.reader.length);

    this.articulationFirstId = r.u32();
    this.articulationCount = r.u32();

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

    assert(r.u32(), 0);
    assert(r.u32(), 0);
    assert(r.u32(), 0);
    assert(r.u32(), 0);

    assert(r.u32(), 0);
    assert(r.u32(), 0);
    assert(r.u32(), 0);
    assert(r.u32(), 0);

    assert(this.pos(), 0x40);
  }

  articulationSection() {
    this.articulations = [];

    for (let i = 0; i < this.articulationCount; ++i) {
      this.articulations.push(this.articulation(i));
    }
  }

  articulation(i) {
    const r = this.reader;

    const articulation = {
      id: this.articulationFirstId + i,
      sampleOffset: r.u32(),
      loopPoint: r.u32(),
      fineTune: r.s16(),
      unityKey: r.u16(),
      adsr1: r.s16(),
      adsr2: r.s16(),
    };

    assert(articulation.sampleOffset <= articulation.loopPoint);

    return articulation;
  }

  sampleSection() {
    const r = this.reader;
    r.seek(0x40 + this.articulationCount * 0x10);

    this.sampleOffsets = [];

    let j = 0;

    for (let i = this.pos(); i < this.length; ++i) {
      j = r.r.u8() === 0 ? j + 1 : 0;
      if (j >= 0x10) {
        this.sampleOffsets.push(this.pos() - j);
        j = 0;
      }
    }

    console.log(this.sampleOffsets);

    this.samples = [];

    for (let i = 0; i < this.sampleOffsets.length - 1; ++i) {
      r.seek(this.sampleOffsets[i]);
      this.samples.push(
        this.sample(
          (this.sampleOffsets[i + 1] || this.length) - this.sampleOffsets[i]
        )
      );
    }
  }

  sample(size) {
    console.log(size);
    const r = this.reader;

    assert(r.u32(), 0);
    assert(r.u32(), 0);
    assert(r.u32(), 0);
    assert(r.u32(), 0);

    const a = r.u8();
    const b = r.u8();

    const sample = {
      range: a & 0xf,
      filter: (a & 0xf0) >> 4,
      end: b & 0x1,
      looping: b & 0x2,
      loop: b & 0x4,
      data: [],
    };

    for (let i = 0; i < size - 18; ++i) {
      sample.data.push(r.s8());
    }

    return sample;
  }

  sampleToWave(sample) {
    let prev = { prev1: 0, prev2: 0 };
    const wave = [];
    for (let i = 0; i < sample.samples.length; i++) {
      prev = this.decompressSample(sample.samples, prev.prev1, prev.prev2);
    }
    return wave;
  }

  // from https://github.com/vgmtrans/vgmtrans/blob/fe5b065ad7ebd2880b2428bd8a4fb485f63adf84/src/main/formats/PSXSPU.cpp
  decompressSample(sample, prev1, prev2) {
    let t; // Temporary sample
    let f1, f2;
    let p1, p2;

    const shift = sample.range + 16; // Shift amount for compressed samples

    const wave = (sample.wave = []);

    for (let i = 0; i < 14; i++) {
      wave[i * 2] = (sample.data[i] << 28) >> shift;
      wave[i * 2 + 1] = ((sample.data[i] & 0xf0) << 24) >> shift;
    }

    // Apply ADPCM decompression
    const i = sample.filter;

    if (i) {
      f1 = AdpcmCoeff[i][0];
      f2 = AdpcmCoeff[i][1];
      p1 = prev1;
      p2 = prev2;

      for (let i = 0; i < 28; i++) {
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
  }
}
