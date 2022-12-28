import { createCachedCompiledFunction } from '../compilation';
import { createArray } from '../utils';
import { NDArray } from '../ndarray';
import { create } from './create';

type DotArgs = [a: NDArray, b: NDArray];

function generateDotCode(key: string): string {
  const [rows, sumProductLength, columns] = key.split('x').map(d => parseInt(d));
  return `
    const outArray = create(a.dataType, [${rows}, ${columns}]);

    ${createArray(rows, i =>
      createArray(
        columns,
        j =>
          `outArray.data[${i * columns + j}] = ${createArray(
            sumProductLength,
            k => `a.data[a.strides[0] * ${i} + a.strides[1] * ${k}] * b.data[b.strides[0] * ${k} + b.strides[1] * ${j}]`
          ).join(' + ')};`
      ).join('\n')
    ).join('\n')}

    return outArray;
  `;
}

const dot = createCachedCompiledFunction<string, DotArgs, NDArray>(
  (a, b) => {
    if (a.shape.length != 2 || b.shape.length != 2) throw new Error('Both arrays must be 2D!');
    if (a.shape[1] != b.shape[0]) throw new Error('Columns of A must match rows of B!');
    return `${a.shape[0]}x${a.shape[1]}x${b.shape[1]}`;
  },
  generateDotCode,
  ['a', 'b'],
  { create }
);

export { dot };
