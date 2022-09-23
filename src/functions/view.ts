import { createCachedCompiledFunction } from '../compilation';
import { $IS_NDARRAY, NDArray } from '../ndarray';
import { createArray } from '../utils';

interface NDArrayViewOptions {
  strides?: number[];
  offset?: number;
  isContiguous?: boolean;
  isAligned?: boolean;
  shape?: number[];
}

type ViewArgs = [array: NDArray, options?: NDArrayViewOptions];

function generateViewCode(dimensions: number): string {
  return `
    options = options || {};

    var strides = options.strides || array.strides;
    if (options.shape != null && options.strides == null) {
      strides = [${createArray(dimensions, 1).join(', ')}];
      ${createArray(
        dimensions - 1,
        i => `strides[${dimensions - i - 2}] = options.shape[${dimensions - i - 1}] * strides[${dimensions - i - 1}];`
      ).join('\n')}
    }

    return {
      dataType: array.dataType,
      data: array.data,
      shape: options.shape || array.shape,
      size: options.shape == null ? array.size : ${createArray(dimensions, i => `options.shape[${i}]`).join(' * ')},
      strides: strides,
      offset: options.offset == null ? array.offset : options.offset,
      isView: true,
      isContiguous: options.isContiguous == null ? array.isContiguous : options.isContiguous,
      isAligned: options.isAligned == null ? array.isAligned : options.isAligned,
      [$IS_NDARRAY]: true
    };
  `;
}

const view = createCachedCompiledFunction<number, ViewArgs, NDArray>(
  (_, options) => options?.shape?.length ?? 1,
  generateViewCode,
  ['array', 'options'],
  { $IS_NDARRAY }
);

export { view };
