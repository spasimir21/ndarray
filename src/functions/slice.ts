import { createCachedCompiledFunction } from '../compilation';
import { createArray } from '../utils';
import { NDArray } from '../ndarray';
import { view } from './view';

type SliceArgs = [array: NDArray, from: number[], to?: number[]];

// The isContiguous check is overcompensating for the sake of slice performance
// with the assumption that most calls to slice will result in a non-contiguous array
function generateSliceCode(dimensions: number): string {
  // prettier-ignore
  return `
    var isContiguous = from.length <= 1 && (to == null || to.length <= 1);

    from = [${createArray(
      dimensions,
      i => `from[${i}] < 0 ? array.shape[${i}] + from[${i}] : (from[${i}] || 0)`).join(', ')
    }];

    to = to == null ? array.shape
      : [${createArray(
        dimensions,
        i => `to[${i}] < 0 ? array.shape[${i}] + to[${i}] : (to[${i}] || array.shape[${i}])`).join(', ')
      }];

    return view(array, {
      offset: array.offset + ${createArray(dimensions, i => `from[${i}] * array.strides[${i}]`).join(' + ')},
      shape: [${createArray(dimensions, i => `to[${i}] - from[${i}]`).join(', ')}],
      strides: array.strides,
      isContiguous: isContiguous
    });
  `;
}

const slice = createCachedCompiledFunction<number, SliceArgs, NDArray>(
  array => array.shape.length,
  generateSliceCode,
  ['array', 'from', 'to'],
  { view }
);

export { slice };
