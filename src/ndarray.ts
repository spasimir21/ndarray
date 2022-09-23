import { DataType } from './dataTypes';

type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;

const $IS_NDARRAY: unique symbol = Symbol('$IS_NDARRAY');

interface NDArray {
  dataType: DataType;
  data: TypedArray;
  shape: number[];
  size: number;
  strides: number[];
  offset: number;
  isView: boolean;
  isContiguous: boolean;
  isAligned: boolean;
  [$IS_NDARRAY]: true;
}

function isNDArray(object: any): object is NDArray {
  if (object == null || typeof object !== 'object') return false;
  return $IS_NDARRAY in object;
}

export { TypedArray, $IS_NDARRAY, NDArray, isNDArray };
