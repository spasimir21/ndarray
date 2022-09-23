import { createCachedCompiledFunction } from '../compilation';
import { createArray } from '../utils';
import { NDArray } from '../ndarray';
import { view } from './view';

type GetArgs = [array: NDArray, index: number[]];

function generateGetCode(dimensions: number): string {
  return `
    switch (index.length) {
      ${createArray(
        dimensions - 1,
        i => `
          case ${i + 1}:
            return view(array, {
              offset: array.offset + ${createArray(i + 1, j => `index[${j}] * array.strides[${j}]`).join(' + ')},
              strides: [${createArray(dimensions - i - 1, j => `array.strides[${i + j + 1}]`).join(', ')}],
              shape: [${createArray(dimensions - i - 1, j => `array.shape[${i + j + 1}]`).join(', ')}]
            });
      `
      ).join('\n')}
      case ${dimensions}:
        return array.data[array.offset + ${createArray(dimensions, i => `index[${i}] * array.strides[${i}]`).join(' + ')}];
      default:
        return view(array);
    }
  `;
}

// prettier-ignore
const get = createCachedCompiledFunction<number, GetArgs, NDArray | number>(
  array => array.shape.length,
  generateGetCode,
  ['array', 'index'],
  { view }
);

export { get };
