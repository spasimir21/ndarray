import { toContiguousArray } from './functions/toContiguousArray';
import { DataType, DataTypeSize } from './dataTypes';
import { NDArray } from './ndarray';
import { createArray } from './utils';
import { create } from './functions/create';

interface SerializationInfo {
  dimensionType: 0 | 1 | 2;
  dataType: DataType;
  headerSize: number;
  paddingSize: number;
  dataSize: number;
  totalSize: number;
}

function dimensionTypeToDataType(dimensionType: 0 | 1 | 2): DataType {
  return dimensionType == 0 ? DataType.u8 : dimensionType == 1 ? DataType.u16 : DataType.u32;
}

// Serialization
function getSerializationInfo(array: NDArray): SerializationInfo {
  const maxDimension = Math.max(...array.shape);
  const dimensionType = maxDimension < 256 ? 0 : maxDimension < 65536 ? 1 : 2;

  const headerSize = 4 + array.shape.length * 2 ** dimensionType;
  const dataSize = array.data.length * DataTypeSize[array.dataType];
  const unpaddedSize = headerSize + dataSize;

  const targetLengthFactor = Math.max(4, DataTypeSize[array.dataType]);
  const paddingSize = unpaddedSize % targetLengthFactor == 0 ? 0 : targetLengthFactor - (unpaddedSize % targetLengthFactor);

  return {
    dimensionType,
    dataType: array.dataType,
    headerSize,
    paddingSize,
    dataSize,
    totalSize: headerSize + paddingSize + dataSize
  };
}

function write(view: DataView, offset: number, value: number, dataType: DataType, littleEndian: boolean = false) {
  // prettier-ignore
  switch (dataType) {
    case DataType.i8: view.setInt8(offset, value); break;
    case DataType.u8: view.setUint8(offset, value); break;
    case DataType.i16: view.setInt16(offset, value, littleEndian); break;
    case DataType.u16: view.setUint16(offset, value, littleEndian); break;
    case DataType.i32: view.setInt32(offset, value, littleEndian); break;
    case DataType.u32: view.setUint32(offset, value, littleEndian); break;
    case DataType.f32: view.setFloat32(offset, value, littleEndian); break;
    case DataType.f64: view.setFloat64(offset, value, littleEndian); break;
  }
}

function serialize(array: NDArray): ArrayBuffer {
  if (!array.isAligned || !array.isContiguous || array.size != array.data.length) array = toContiguousArray(array);

  const serializationInfo = getSerializationInfo(array);

  const buffer = new ArrayBuffer(serializationInfo.totalSize);
  const view = new DataView(buffer);

  view.setUint8(0, (serializationInfo.dataType << 2) | serializationInfo.dimensionType);
  view.setUint8(1, array.shape.length);

  const dimensionDataType = dimensionTypeToDataType(serializationInfo.dimensionType);
  const dimensionTypeSize = 2 ** serializationInfo.dimensionType;
  for (let i = 0; i < array.shape.length; i++) write(view, 4 + i * dimensionTypeSize, array.shape[i], dimensionDataType);

  const dataOffset = serializationInfo.headerSize + serializationInfo.paddingSize;

  for (let i = 0; i < array.data.length; i++)
    write(view, dataOffset + i * DataTypeSize[serializationInfo.dataType], array.data[i], array.dataType);

  return buffer;
}

function toJSON(array: NDArray): number[] {
  const buffer = serialize(array);
  const view = new DataView(buffer);
  return createArray(buffer.byteLength / 4, i => view.getInt32(i * 4, false));
}

// Deserialization
function read(view: DataView, offset: number, dataType: DataType, littleEndian: boolean = false): number {
  // prettier-ignore
  switch (dataType) {
    case DataType.i8: return view.getInt8(offset);
    case DataType.u8: return view.getUint8(offset);
    case DataType.i16: return view.getInt16(offset, littleEndian);
    case DataType.u16: return view.getUint16(offset, littleEndian);
    case DataType.i32: return view.getInt32(offset, littleEndian);
    case DataType.u32: return view.getUint32(offset, littleEndian);
    case DataType.f32: return view.getFloat32(offset, littleEndian);
    case DataType.f64: return view.getFloat64(offset, littleEndian);
  }
}

function readShape(view: DataView, dimensionCount: number, dimensionType: 0 | 1 | 2): number[] {
  const dimensionDataType = dimensionTypeToDataType(dimensionType);
  const dimensionTypeSize = 2 ** dimensionType;
  return createArray(dimensionCount, i => read(view, 4 + i * dimensionTypeSize, dimensionDataType, false));
}

function getSerializationInfoFromSerialized(view: DataView): [SerializationInfo, number[]] {
  const typeByte = view.getUint8(0);

  const dimensionType = (typeByte & 0b11) as 0 | 1 | 2;
  const dataType = (typeByte >> 2) as DataType;

  const dimensionCount = view.getUint8(1);

  const shape = readShape(view, dimensionCount, dimensionType);

  const dataPointCount = shape.reduce((count, d) => count * d, 1);

  const headerSize = 4 + dimensionCount * 2 ** dimensionType;
  const dataSize = dataPointCount * DataTypeSize[dataType];
  const paddingSize = view.buffer.byteLength - (headerSize + dataSize);

  return [
    {
      dimensionType,
      dataType,
      headerSize,
      dataSize,
      paddingSize,
      totalSize: view.buffer.byteLength
    },
    shape
  ];
}

function deserialize(buffer: ArrayBuffer): NDArray {
  const view = new DataView(buffer);

  const [serializationInfo, shape] = getSerializationInfoFromSerialized(view);
  const array = create(serializationInfo.dataType, shape);

  const dataOffset = serializationInfo.headerSize + serializationInfo.paddingSize;
  const dataType = serializationInfo.dataType;
  for (let i = 0; i < array.data.length; i++)
    array.data[i] = read(view, dataOffset + i * DataTypeSize[dataType], dataType, false);

  return array;
}

function fromJSON(array: number[]): NDArray {
  const buffer = new ArrayBuffer(array.length * 4);
  const view = new DataView(buffer);
  for (let i = 0; i < array.length; i++) view.setInt32(i * 4, array[i], false);
  return deserialize(buffer);
}

export { serialize, toJSON, deserialize, fromJSON };
