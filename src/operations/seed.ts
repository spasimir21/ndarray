import { CompiledFunction, createCachedCompiledFunction } from '../compilation';
import { generateOptimalUnalignedIteration } from '../functions/_iteration';
import { create } from '../functions/create';
import { DataType } from '../dataTypes';
import { NDArray } from '../ndarray';

type SeedArgs = [dataType: DataType, shape: number[]];
type SeedFillArgs = [array: NDArray];

// prettier-ignore
type SeedOperation<TArgs extends [...any[]] = []> =
  CompiledFunction<[dataType: DataType, shape: number[], ...args: TArgs], NDArray> &
  {
    fill: CompiledFunction<[array: NDArray, ...args: TArgs], NDArray>
  };

function generateSeedCode(dimensions: number, seeder: string): string {
  return `
    var array = create(dataType, shape);
    ${generateOptimalUnalignedIteration(dimensions, ['array'], ['offset'], () => `array.data[offset] = ${seeder};`)}
    return array;
  `;
}

function generateSeedFillCode(dimensions: number, seeder: string): string {
  return `
    ${generateOptimalUnalignedIteration(dimensions, ['array'], ['offset'], () => `array.data[offset] = ${seeder};`)}
    return array;
  `;
}

function createSeed<TArgs extends [...any[]] = []>(seeder: string, args: string[] = [], deps?: Record<string, any>) {
  const seed: SeedOperation<TArgs> = createCachedCompiledFunction<number, [...SeedArgs, ...TArgs], NDArray>(
    (_, shape, ..._args: any[]) => shape.length,
    dimensions => generateSeedCode(dimensions, seeder),
    ['dataType', 'shape', ...args],
    Object.assign({ create }, deps)
  ) as any;

  seed.fill = createCachedCompiledFunction<number, [...SeedFillArgs, ...TArgs], NDArray>(
    (array, ..._args: any[]) => array.shape.length,
    dimensions => generateSeedFillCode(dimensions, seeder),
    ['array', ...args],
    deps
  );

  return seed;
}

export { SeedOperation, createSeed };
