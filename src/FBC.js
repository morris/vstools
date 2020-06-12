import { parseColor } from './VSTOOLS.js';

export class FBC {
  constructor(reader) {
    this.reader = reader;
  }

  read() {
    const r = this.reader;

    this.palette = [];

    for (let i = 0; i < 256; ++i) {
      const c = parseColor(r.u16());
      this.palette.push(c);
    }
  }
}
