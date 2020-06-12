import { parseColor } from './VSTOOLS.js';

export class WEPPalette {
  constructor(reader) {
    this.reader = reader;
    this.colors = [];
  }

  read(num) {
    const r = this.reader;

    for (let i = 0; i < num; ++i) {
      this.colors.push(parseColor(r.u16()));
    }
  }

  add(colors) {
    this.colors.push(...colors);
  }
}
