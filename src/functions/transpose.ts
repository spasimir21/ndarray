import { createCachedCompiledFunction } from '../compilation';
import { createArray } from '../utils';
import { NDArray } from '../ndarray';
import { view } from './view';

type TransposeArgs = [array: NDArray, axes?: number[]];

function generateTransposeCode(dimensions: number): string {
  if (dimensions == 1) return `return view(array);`;

  return `
    return view(array, {
      shape: axes == null 
        ? [${createArray(dimensions, i => `array.shape[${dimensions - i - 1}]`).join(', ')}]
        : [${createArray(dimensions, i => `array.shape[axes[${i}]]`).join(', ')}],
      strides: axes == null 
        ? [${createArray(dimensions, i => `array.strides[${dimensions - i - 1}]`).join(', ')}]
        : [${createArray(dimensions, i => `array.strides[axes[${i}]]`).join(', ')}],
      isAligned: false
    });
  `;
}

// prettier-ignore
const transpose = createCachedCompiledFunction<number, TransposeArgs, NDArray>(
  array => array.shape.length,
  generateTransposeCode,
  ['array', 'axes'],
  { view }
);

export { transpose };
