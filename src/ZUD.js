import { SHP } from './SHP.js';
import { WEP } from './WEP.js';
import { SEQ } from './SEQ.js';

export function ZUD(reader) {
  reader.extend(this);
}

ZUD.prototype.read = function () {
  this.header();
  this.data();
};

ZUD.prototype.header = function () {
  const u8 = this.u8,
    u32 = this.u32,
    skip = this.skip;

  this.idCharacter = u8();
  this.idWeapon = u8();
  this.idWeaponCategory = u8();
  this.idWeaponMaterial = u8();
  this.idShield = u8();
  this.idShieldMaterial = u8();
  this.unknown = u8();
  skip(1); // padding
  this.ptrCharacterSHP = u32();
  this.lenCharacterSHP = u32();
  this.ptrWeaponWEP = u32();
  this.lenWeaponWEP = u32();
  this.ptrShieldWEP = u32();
  this.lenShieldWEP = u32();
  this.ptrCommonSEQ = u32();
  this.lenCommonSEQ = u32();
  this.ptrBattleSEQ = u32();
  this.lenBattleSEQ = u32();
};

ZUD.prototype.data = function () {
  const reader = this.reader,
    seek = this.seek;

  this.shp = new SHP(reader);
  this.shp.read();

  seek(this.ptrWeaponWEP);

  try {
    this.weapon = new WEP(reader);
    this.weapon.read();
  } catch (ex) {
    this.weapon = null;
  }

  seek(this.ptrShieldWEP);

  try {
    this.shield = new WEP(reader);
    this.shield.read();
  } catch (ex) {
    this.shield = null;
  }

  seek(this.ptrCommonSEQ);

  try {
    this.com = new SEQ(reader, this.shp);
    this.com.read();
  } catch (ex) {
    this.com = null;
  }

  seek(this.ptrBattleSEQ);

  try {
    this.bt = new SEQ(reader, this.shp);
    this.bt.read();
  } catch (ex) {
    this.bt = null;
  }
};

ZUD.prototype.build = function () {
  this.shp.build();

  if (this.weapon) this.weapon.build();
  if (this.shield) this.shield.build();
  if (this.bt) this.bt.build();
  if (this.com) this.com.build();

  this.mesh = this.shp.mesh;
};

ZUD.prototype.geometrySnapshot = function () {
  return this.shp.geometrySnapshot();
};
