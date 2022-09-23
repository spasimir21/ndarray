import { createCachedCompiledFunction } from '../compilation';
import { generateOptimalIteration } from './_iteration';
import { NDArray } from '../ndarray';
import { create } from './create';

type ToContiguousArrayArgs = [array: NDArray];

function generateToContiguousArrayCode(dimensions: number): string {
  return `
    var contArray = create(array.dataType, array.shape);

    var contOffset = 0;
    ${generateOptimalIteration(dimensions, ['array'], ['offset'], isFast =>
      isFast
        ? 'contArray.data[i] = array.data[offset];'
        : `contArray.data[contOffset] = array.data[offset];
           contOffset++;`
    )}

    return contArray;
  `;
}

const toContiguousArray = createCachedCompiledFunction<number, ToContiguousArrayArgs, NDArray>(
  array => array.shape.length,
  generateToContiguousArrayCode,
  ['array'],
  { create }
);

export { toContiguousArray };
