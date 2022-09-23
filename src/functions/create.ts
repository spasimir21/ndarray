import { $IS_NDARRAY, NDArray, TypedArray } from '../ndarray';
import { createCachedCompiledFunction } from '../compilation';
import { DataType, DataTypeArray } from '../dataTypes';
import { createArray } from '../utils';

type CreateArgs = [dataType: DataType, shape: number[], data?: TypedArray];

function generateCreateCode(dimensions: number): string {
  return `
    var size = ${createArray(dimensions, i => `shape[${i}]`).join(' * ')};

    var strides = [${createArray(dimensions, 1).join(', ')}];
    ${createArray(
      dimensions - 1,
      i => `strides[${dimensions - i - 2}] = shape[${dimensions - i - 1}] * strides[${dimensions - i - 1}];`
    ).join('\n')}

    return {
      dataType: dataType,
      data: data == null ? new DataTypeArray[dataType](size) : data,
      shape: shape,
      size: size,
      strides: strides,
      offset: 0,
      isView: false,
      isContiguous: true,
      isAligned: true,
      [$IS_NDARRAY]: true
    };
  `;
}

const create = createCachedCompiledFunction<number, CreateArgs, NDArray>(
  (_, shape) => shape.length,
  generateCreateCode,
  ['dataType', 'shape', 'data'],
  { DataTypeArray, $IS_NDARRAY }
);

export { create };
