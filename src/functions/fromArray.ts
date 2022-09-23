import { DataType } from '../dataTypes';
import { NDArray } from '../ndarray';
import { create } from './create';

function getArrayShape(array: any[], shape: number[] = []): number[] {
  shape.push(array.length);
  if (!(array[0] instanceof Array)) return shape;
  return getArrayShape(array[0], shape);
}

function extractValuesToNDArray(array: any[], ndarray: NDArray, offset: number = 0): number {
  if (array[0] instanceof Array) {
    for (let i = 0; i < array.length; i++) {
      offset = extractValuesToNDArray(array[i], ndarray, offset);
    }

    return offset;
  }

  for (let i = 0; i < array.length; i++) {
    ndarray.data[offset + i] = array[i];
  }

  return offset + array.length;
}

function fromArray(dataType: DataType, array: any[]): NDArray {
  const ndarray = create(dataType, getArrayShape(array));
  extractValuesToNDArray(array, ndarray);
  return ndarray;
}

export { fromArray };
