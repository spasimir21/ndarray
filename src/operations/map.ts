import { generateOptimalIteration, generateOptimalUnalignedIteration } from '../functions/_iteration';
import { createCachedCompiledFunction, CompiledFunction } from '../compilation';
import { create } from '../functions/create';
import { NDArray } from '../ndarray';

type MapArgs = [array: NDArray];

// prettier-ignore
type MapOperation<TArgs extends [...any[]] = []> = 
  CompiledFunction<[array: NDArray, ...args: TArgs], NDArray> & 
  {
    inplace: CompiledFunction<[array: NDArray, ...args: TArgs], NDArray>;
  };

function generateInplaceMapCode(dimensions: number, operation: string): string {
  return `
    var x;

    ${generateOptimalUnalignedIteration(
      dimensions,
      ['array'],
      ['offset'],
      () => `x = array.data[offset];
             array.data[offset] = ${operation};`
    )}

    return array;
  `;
}

function generateMapCode(dimensions: number, operation: string): string {
  return `
    var mappedArray = create(array.dataType, array.shape);

    var contOffset = 0;
    var x;
    ${generateOptimalIteration(
      dimensions,
      ['array'],
      ['offset'],
      isFast =>
        `x = array.data[offset];
         ${
           isFast
             ? `mappedArray.data[i] = ${operation};`
             : `mappedArray.data[contOffset] = ${operation};
                contOffset++;`
         }`
    )}

    return mappedArray;
  `;
}

function createMap<TArgs extends [...any[]] = []>(operation: string, args: string[] = [], deps?: Record<string, any>) {
  const map: MapOperation<TArgs> = createCachedCompiledFunction<number, [...MapArgs, ...TArgs], NDArray>(
    (array, ..._args: any[]) => array.shape.length,
    dimensions => generateMapCode(dimensions, operation),
    ['array', ...args],
    Object.assign({ create }, deps)
  ) as any;

  map.inplace = createCachedCompiledFunction<number, [...MapArgs, ...TArgs], NDArray>(
    (array, ..._args: any[]) => array.shape.length,
    dimensions => generateInplaceMapCode(dimensions, operation),
    ['array', ...args],
    deps
  ) as any;

  return map;
}

const exp = createMap('Math.exp(x)');

export { MapOperation, createMap, exp };
