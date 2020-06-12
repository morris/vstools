export class Akao {
  constructor(reader) {
    this.reader = reader;
  }

  read() {
    const r = this.reader;

    r.skip(4); // AKAO, 4
    this.id = r.u16(); // 6
    this.length = r.u16(); // 8
    r.skip(8); // unknown, 16

    const mask = (this.channelMask = r.u32());
    const channels = (this.channels = []);

    for (let i = 0; i < 32; ++i) {
      if ((mask >> i) & (1 === 1)) {
        channels.push({ c: i, ops: [] });
      }
    }

    const offset = (this.offset = r.pos);

    channels.forEach(function (channel) {
      channel.offset = r.u16();
    });

    channels.forEach(function (channel) {
      const ops = channel.ops;
      r.seek(offset + channel.offset);

      let done = false;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const op = r.u8();
        const params = [];

        switch (op) {
          case 0xc8:
          case 0xca:
            done = true;
            break;
          case 0xcd:
          case 0xd1:
          case 0xc2:
            break;

          case 0xa1:
          case 0xa8:
          case 0xaa:
          case 0xa3:
          case 0xa5:
            params.push(r.u8());
            break;

          case 0xe8:
          case 0xea:
          case 0xfd:
          case 0xfe:
            params.push(r.u16());
            break;

          case 0xb4:
            params.push(r.u8(), r.u8(), r.u8());
            break;

          case 0xa0:
            done = true;
            break;

          default:
            done = true;
        }

        ops.push({ op: op, params: params });

        if (done) break;
      }
    });
  }
}
