import { createCachedCompiledFunction } from '../compilation';
import { NDArray } from '../ndarray';
import { createArray } from '../utils';

type SetArgs = [array: NDArray, index: number[], value: number];

function generateSetCode(dimensions: number): string {
  return `
    array.data[array.offset + ${createArray(dimensions, i => `index[${i}] * array.strides[${i}]`).join(' + ')}] = value;
  `;
}

// prettier-ignore
const set = createCachedCompiledFunction<number, SetArgs, void>(
  array => array.shape.length,
  generateSetCode,
  ['array', 'index', 'value']
);

export { set };
