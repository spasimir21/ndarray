import { createCachedCompiledFunction } from '../compilation';
import { generateOptimalIteration } from './_iteration';
import { NDArray } from '../ndarray';
import { create } from './create';
import { createArray } from '../utils';

type FlattenArgs = [array: NDArray];

function generateFlattenCode(dimensions: number): string {
  return `
    var flat = create(array.dataType, [${createArray(dimensions, i => `array.shape[${i}]`).join(' * ')}]);

    var contOffset = 0;
    ${generateOptimalIteration(dimensions, ['array'], ['offset'], isFast =>
      isFast
        ? 'flat.data[i] = array.data[offset];'
        : `flat.data[contOffset] = array.data[offset];
           contOffset++;`
    )}

    return flat;
  `;
}

const flatten = createCachedCompiledFunction<number, FlattenArgs, NDArray>(
  array => array.shape.length,
  generateFlattenCode,
  ['array'],
  { create }
);

export { flatten };
