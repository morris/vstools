import { color } from './VSTOOLS.js';

export function WEPPalette(reader) {
  this.colors = [];

  this.read = function (num) {
    for (let i = 0; i < num; ++i) {
      this.colors.push(color(reader.u16()));
    }
  };

  this.push = function (colors) {
    this.colors.push.apply(this.colors, colors);
  };
}
