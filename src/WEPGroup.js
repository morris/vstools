export function WEPGroup(reader) {
  this.read = function () {
    this.boneId = reader.s16();
    this.lastVertex = reader.u16();
  };
}
