import { generateOptimalUnalignedIteration } from './_iteration';
import { createCachedCompiledFunction } from '../compilation';
import { NDArray } from '../ndarray';

type FillArgs = [array: NDArray, value: number];

function generateFillCode(dimensions: number): string {
  return `
    if (array.size == array.data.length) {
      array.data.fill(value);
      return array;
    }
  
    ${generateOptimalUnalignedIteration(dimensions, ['array'], ['offset'], () => 'array.data[offset] = value;')}

    return array;
  `;
}

// prettier-ignore
const fill = createCachedCompiledFunction<number, FillArgs, NDArray>(
  array => array.shape.length,
  generateFillCode,
  ['array', 'value']
);

export { fill };
