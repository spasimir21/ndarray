import { createCachedCompiledFunction } from '../compilation';
import { generateOptimalIteration } from './_iteration';
import { createArray } from '../utils';
import { NDArray } from '../ndarray';

type EqualArgs = [a: NDArray, b: NDArray, strict?: boolean];

function generateEqualCode(dimensions: number): string {
  return `
    if (a.size != b.size || a.shape.length != b.shape.length) return false;

    if (strict &&
      (a.dataType != b.dataType ||
      ${createArray(dimensions, i => `a.shape[${i}] != b.shape[${i}]`).join(' || ')})
    ) return false;

    ${generateOptimalIteration(
      dimensions,
      ['a', 'b'],
      ['aOffset', 'bOffset'],
      () => 'if (a.data[aOffset] != b.data[bOffset]) return false;'
    )}

    return true;
  `;
}

console.log(generateEqualCode(3));
// prettier-ignore
const equal = createCachedCompiledFunction<number, EqualArgs, boolean>(
  a => a.shape.length,
  generateEqualCode,
  ['a','b','strict']
);

export { equal };
