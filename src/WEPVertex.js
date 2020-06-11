export function WEPVertex(reader) {
  this.read = function () {
    this.x = reader.s16();
    this.y = reader.s16();
    this.z = reader.s16();
    reader.skip(2); // TODO zero padding?
  };
}
