import { createCachedCompiledFunction } from '../compilation';
import { generateSlowIteration } from './_iteration';
import { NDArray } from '../ndarray';

type StringifyArgs = [array: NDArray];

function generateStringifyCode(dimensions: number): string {
  return `
    var string = '';

    ${generateSlowIteration(dimensions, ['array'], ['offset'], {
      start: i => `
          string += '${' '.repeat(i)}[';
          ${i != dimensions - 1 ? "string += '\\n';" : ''}
        `,
      pre: i =>
        i == dimensions - 1
          ? `string += array.data[offset].toString();
              if (i${i} != array.shape[${i}] - 1) string += ' ';`
          : '',
      end: i => `
          ${i != dimensions - 1 ? "string += '\\n';" : ''}
          string += '${i != dimensions - 1 ? ' '.repeat(i) : ''}]';
          ${i != 0 ? `if (i${i - 1} != array.shape[${i - 1}] - 1) string += '\\n';` : ''}
        `
    })}

    return string;
  `;
}

// prettier-ignore
const stringify = createCachedCompiledFunction<number, StringifyArgs, NDArray>(
  array => array.shape.length,
  generateStringifyCode,
  ['array']
);

export { stringify };
