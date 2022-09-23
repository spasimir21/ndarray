// prettier-ignore
enum DataType {
  i8, u8,
  i16, u16,
  i32, u32,
  f32, f64
}

const DataTypeArray = {
  [DataType.i8]: Int8Array,
  [DataType.u8]: Uint8Array,
  [DataType.i16]: Int16Array,
  [DataType.u16]: Uint16Array,
  [DataType.i32]: Int32Array,
  [DataType.u32]: Uint32Array,
  [DataType.f32]: Float32Array,
  [DataType.f64]: Float64Array
};

const DataTypeSize = {
  [DataType.i8]: 1,
  [DataType.u8]: 1,
  [DataType.i16]: 2,
  [DataType.u16]: 2,
  [DataType.i32]: 4,
  [DataType.u32]: 4,
  [DataType.f32]: 4,
  [DataType.f64]: 8
};

export { DataType, DataTypeArray, DataTypeSize };
