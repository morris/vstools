import { SHP } from './SHP.js';
import { WEP } from './WEP.js';
import { SEQ } from './SEQ.js';

export class ZUD {
  constructor(reader) {
    this.reader = reader;
  }

  read() {
    this.header();
    this.data();
  }

  header() {
    const r = this.reader;

    this.idCharacter = r.u8();
    this.idWeapon = r.u8();
    this.idWeaponCategory = r.u8();
    this.idWeaponMaterial = r.u8();
    this.idShield = r.u8();
    this.idShieldMaterial = r.u8();
    this.unknown = r.u8();
    r.skip(1); // padding
    this.ptrCharacterSHP = r.u32();
    this.lenCharacterSHP = r.u32();
    this.ptrWeaponWEP = r.u32();
    this.lenWeaponWEP = r.u32();
    this.ptrShieldWEP = r.u32();
    this.lenShieldWEP = r.u32();
    this.ptrCommonSEQ = r.u32();
    this.lenCommonSEQ = r.u32();
    this.ptrBattleSEQ = r.u32();
    this.lenBattleSEQ = r.u32();
  }

  data() {
    const r = this.reader;

    this.shp = new SHP(r);
    this.shp.read();

    r.seek(this.ptrWeaponWEP);

    try {
      this.weapon = new WEP(r);
      this.weapon.read();
    } catch (ex) {
      this.weapon = null;
    }

    r.seek(this.ptrShieldWEP);

    try {
      this.shield = new WEP(r);
      this.shield.read();
    } catch (ex) {
      this.shield = null;
    }

    r.seek(this.ptrCommonSEQ);

    try {
      this.com = new SEQ(r, this.shp);
      this.com.read();
    } catch (ex) {
      this.com = null;
    }

    r.seek(this.ptrBattleSEQ);

    try {
      this.bt = new SEQ(r, this.shp);
      this.bt.read();
    } catch (ex) {
      this.bt = null;
    }
  }

  build() {
    this.shp.build();

    if (this.weapon) this.weapon.build();
    if (this.shield) this.shield.build();
    if (this.bt) this.bt.build();
    if (this.com) this.com.build();

    this.mesh = this.shp.mesh;
  }
}
