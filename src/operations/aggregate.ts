import { generateOptimalIteration, generateOptimalUnalignedIteration } from '../functions/_iteration';
import { createCachedCompiledFunction } from '../compilation';
import { NDArray } from '../ndarray';

type AggregateArgs = [array: NDArray];

type AggregateOperation<T, TArgs extends [...any[]] = []> = (array: NDArray, ...args: TArgs) => T;

function generateAggregateCode(dimensions: number, operation: string, start: string, aligned: boolean): string {
  return `
    var total = ${start};
    var x;

    ${(aligned ? generateOptimalIteration : generateOptimalUnalignedIteration)(
      dimensions,
      ['array'],
      ['offset'],
      () => `x = array.data[offset];
             total = ${operation};`
    )}

    return total;
  `;
}

function createAggregate<T, TArgs extends [...any[]] = []>(
  operation: string,
  start: string,
  aligned: boolean = true,
  args: string[] = [],
  deps?: Record<string, any>
): AggregateOperation<T, TArgs> {
  return createCachedCompiledFunction<number, [...AggregateArgs, ...TArgs], T>(
    (array, ..._args: any[]) => array.shape.length,
    dimensions => generateAggregateCode(dimensions, operation, start, aligned),
    ['array', ...args],
    deps
  ) as unknown as (array: NDArray, ...args: TArgs) => T;
}

const sum = createAggregate<number>('total + x', '0', false);

export { AggregateOperation, createAggregate, sum };
