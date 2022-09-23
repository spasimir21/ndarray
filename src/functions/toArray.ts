import { createCachedCompiledFunction } from '../compilation';
import { generateSlowIteration } from './_iteration';
import { NDArray } from '../ndarray';

type ToArrayArgs = [ndarray: NDArray];

function generateToArrayCode(dimensions: number): string {
  return `
    var array = [];

    ${generateSlowIteration(dimensions, ['ndarray'], ['offset'], {
      pre: i => (i == dimensions - 1 ? `array${i == 0 ? '' : i - 1}.push(ndarray.data[offset]);` : `var array${i} = [];`),
      post: i => (i == dimensions - 1 ? '' : i == 0 ? `array.push(array${i});` : `array${i - 1}.push(array${i});`)
    })}

    return array;
  `;
}

// prettier-ignore
const toArray = createCachedCompiledFunction<number, ToArrayArgs, any[]>(
  array => array.shape.length,
  generateToArrayCode,
  ['ndarray']
);

export { toArray };
