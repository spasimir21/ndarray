import { CompiledFunction, createCachedCompiledFunction } from '../compilation';
import { generateOptimalIteration } from '../functions/_iteration';
import { create } from '../functions/create';
import { NDArray } from '../ndarray';

type FlatOpMMArgs = [a: NDArray, b: NDArray];
type FlatOpSMArgs = [a: number, b: NDArray];
type FlatOpMSArgs = [a: NDArray, b: number];
type FlatOpSSArgs = [a: number, b: number];

// prettier-ignore
type PartialFlatOperation<TArgs extends [...any[]], TReturn> =
  CompiledFunction<TArgs, TReturn> &
  {
    inplace: CompiledFunction<TArgs, TReturn>;
  };

// prettier-ignore
type FlatOperation<TArgs extends [...any[]] = []> =
  ((a: NDArray, b: NDArray, ...args: TArgs) => NDArray) &
  ((a: number, b: NDArray, ...args: TArgs) => NDArray) &
  ((a: NDArray, b: number, ...args: TArgs) => NDArray) &
  ((a: number, b: number, ...args: TArgs) => number) &
  {
    inplace:
      ((a: NDArray, b: NDArray, ...args: TArgs) => NDArray) &
      ((a: number, b: NDArray, ...args: TArgs) => NDArray) &
      ((a: NDArray, b: number, ...args: TArgs) => NDArray) &
      ((a: number, b: number, ...args: TArgs) => number);
    mm: PartialFlatOperation<[a: NDArray, b: NDArray, ...args: TArgs], NDArray>;
    sm: PartialFlatOperation<[a: number, b: NDArray, ...args: TArgs], NDArray>;
    ms: PartialFlatOperation<[a: NDArray, b: number, ...args: TArgs], NDArray>;
    ss: PartialFlatOperation<[a: number, b: number, ...args: TArgs], number>;
  };

function generatePartialFlatOpCode(
  dimensions: number,
  operation: string,
  inplace: boolean,
  isAScalar: boolean,
  isBScalar: boolean
): string {
  if (isAScalar && isBScalar) return `return ${operation};`;

  const mainArray = isAScalar ? 'bArray' : 'aArray';

  // prettier-ignore
  const arrays =
    [isAScalar ? null : 'aArray', isBScalar ? null : 'bArray', inplace ? null : 'newArray']
    .filter(x => x != null) as string[];

  // prettier-ignore
  const offsets =
    [isAScalar ? null : 'aOffset', isBScalar ? null : 'bOffset', inplace ? null : 'newOffset']
    .filter(x => x != null) as string[];

  const outOffset = inplace ? (isAScalar ? 'bOffset' : 'aOffset') : 'newOffset';
  const outArray = inplace ? mainArray : 'newArray';

  return `
    ${inplace ? '' : `var newArray = create(${mainArray}.dataType, ${mainArray}.shape);`}
    ${isAScalar ? '' : 'var a;'}
    ${isBScalar ? '' : 'var b;'}

    ${generateOptimalIteration(
      dimensions,
      arrays,
      offsets,
      () => `
        ${isAScalar ? '' : `a = aArray.data[aOffset];`}
        ${isBScalar ? '' : `b = bArray.data[bOffset];`}
        ${outArray}.data[${outOffset}] = ${operation};
      `
    )}

    return ${outArray};
  `;
}

function createPartialFlatOp<TArgs extends [...any[]], TReturn>(
  operation: string,
  isAScalar: boolean,
  isBScalar: boolean,
  args: string[] = [],
  deps?: Record<string, any>
): PartialFlatOperation<TArgs, TReturn> {
  // prettier-ignore
  const keyFor =
    isAScalar && isBScalar ? () => -1
      : isAScalar ? (...args: any[]) => args[1].shape.length
      : (...args: any[]) => args[0].shape.length;

  const partialFlatOp: PartialFlatOperation<TArgs, TReturn> = createCachedCompiledFunction<number, TArgs, TReturn>(
    keyFor,
    dimensions => generatePartialFlatOpCode(dimensions, operation, false, isAScalar, isBScalar),
    [isAScalar ? 'a' : 'aArray', isBScalar ? 'b' : 'bArray', ...args],
    Object.assign({ create }, deps)
  ) as any;

  partialFlatOp.inplace = createCachedCompiledFunction<number, TArgs, TReturn>(
    keyFor,
    dimensions => generatePartialFlatOpCode(dimensions, operation, true, isAScalar, isBScalar),
    [isAScalar ? 'a' : 'aArray', isBScalar ? 'b' : 'bArray', ...args],
    Object.assign({ create }, deps)
  );

  return partialFlatOp;
}

function createFlatOp<TArgs extends [...any[]] = []>(operation: string, args: string[] = [], deps?: Record<string, any>) {
  const mm = createPartialFlatOp<[...FlatOpMMArgs, ...TArgs], NDArray>(operation, false, false, args, deps);
  const sm = createPartialFlatOp<[...FlatOpSMArgs, ...TArgs], NDArray>(operation, true, false, args, deps);
  const ms = createPartialFlatOp<[...FlatOpMSArgs, ...TArgs], NDArray>(operation, false, true, args, deps);
  const ss = createPartialFlatOp<[...FlatOpSSArgs, ...TArgs], number>(operation, true, true, args, deps);

  const flatOp: FlatOperation<TArgs> = ((a: NDArray | number, b: NDArray | number, ...args: TArgs) => {
    if (typeof a === 'number') return typeof b === 'number' ? ss(a, b, ...args) : sm(a, b, ...args);
    return typeof b === 'number' ? ms(a, b, ...args) : mm(a, b, ...args);
  }) as any;

  flatOp.inplace = ((a: NDArray | number, b: NDArray | number, ...args: TArgs) => {
    if (typeof a === 'number') return typeof b === 'number' ? ss(a, b, ...args) : sm.inplace(a, b, ...args);
    return typeof b === 'number' ? ms.inplace(a, b, ...args) : mm.inplace(a, b, ...args);
  }) as any;

  flatOp.mm = mm;
  flatOp.sm = sm;
  flatOp.ms = ms;
  flatOp.ss = ss;

  return flatOp;
}

export { FlatOperation, createFlatOp };
