import { hex } from './VSTOOLS.js';

export function convertText(i, len, end) {
  len = len || i.length;

  let s = '';
  let j = 0;

  while (j < len) {
    if (i[j] === 0xfa) {
      // control code 0xFA

      if (i[j + 1] === 0x06) {
        // space

        s += ' ';
        j += 2;
      } else {
        // TODO unknown

        // s += '{0xfa' + hex(i[ j + 1 ]) + '}';
        j += 2;
      }
    } else if (i[j] === 0xf8) {
      // control code 0xF8

      // unknown, skip
      j += 2;
    } else if (i[j] === 0xfc) {
      // control code 0xFC

      // unknown, skip
      j += 2;
    } else if (i[j] === 0xfb) {
      // control code 0xFB

      // unknown, skip
      j += 2;
    } else if (i[j] === 0xe7 && end) {
      // end of string

      return s;
    } else {
      s += chr(i[j]);
      ++j;
    }
  }

  return s;
}

export function chr(i) {
  const c = map[i];

  if (c) {
    return c;
  } else {
    return '{' + hex(i, 2) + '}';
  }
}

const map = new Array(0xe9);

// 0 - 9
let i;

for (i = 0; i <= 0x09; ++i) {
  put(i, String.fromCharCode(i + 0x30));
}

// A - Z
for (i = 0x0a; i <= 0x23; ++i) {
  put(i, String.fromCharCode(i + 0x41 - 0x0a));
}

// a - z
for (i = 0x24; i <= 0x3d; ++i) {
  put(i, String.fromCharCode(i + 0x61 - 0x24));
}

put(0x40, '_');
put(0x41, 'Â');
put(0x42, 'Ä');
put(0x43, 'Ç');
put(0x44, 'È');
put(0x45, 'É');
put(0x46, 'Ê');
put(0x47, 'Ë');
put(0x48, 'Ì');
put(0x49, '_');
put(0x4a, 'Î');
put(0x4b, '_');
put(0x4c, 'Ò');
put(0x4d, 'Ó');
put(0x4e, 'Ô');
put(0x4f, 'Ö');
put(0x50, 'Ù');
put(0x51, 'Ú');
put(0x52, 'Û');
put(0x53, 'Ü');
put(0x54, 'ß');
put(0x55, 'æ');
put(0x56, 'à');
put(0x57, 'á');
put(0x58, 'â');
put(0x59, 'ä');
put(0x5a, 'ç');
put(0x5b, 'è');
put(0x5c, 'é');
put(0x5d, 'ê');
put(0x5e, 'ë');
put(0x5f, 'ì');
put(0x60, 'í');
put(0x61, 'î');
put(0x62, 'ï');
put(0x63, 'ò');
put(0x64, 'ó');
put(0x65, 'ô');
put(0x66, 'ö');
put(0x67, 'ù');
put(0x68, 'ú');
put(0x69, 'û');
put(0x6a, 'ü');

put(0x8f, ' ');

// long dash
put(0x8d, '--');

put(0x90, '!');
put(0x91, "'");

put(0x94, '%');

put(0x96, "'");
put(0x97, '( ');
put(0x98, ' )');

put(0x9b, '[');
put(0x9c, ']');
put(0x9d, ';');
put(0x9e, ':');
put(0x9f, ',');
put(0xa0, '.');
put(0xa1, '/');
put(0xa2, '\\');
put(0xa3, '<');
put(0xa4, '>');
put(0xa5, '?');

put(0xa7, '-');
put(0xa8, '+');

put(0xb6, 'Lv.'); // TODO what's this?

put(0xe8, '\n');

function put(i, c) {
  map[i] = c;
}
