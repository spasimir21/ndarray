import { createMap, MapOperation } from './operations/map';
import { createFlatOp } from './operations/flatOp';
import { transpose } from './functions/transpose';
import { createSeed } from './operations/seed';
import { DataType } from './dataTypes';
import { dot } from './functions/dot';
import { NDArray } from './ndarray';

function timeit(name: string, op: () => any, n: number) {
  const startTime = process.hrtime();
  for (let i = 0; i < n; i++) op();
  const endTime = process.hrtime(startTime);
  const ms = endTime[0] * 1000 + endTime[1] / 1000000;
  const formatter = new Intl.NumberFormat();
  console.log(`${name}: ${formatter.format(Math.floor((1000 / ms) * n))} op/s (${ms / n}ms) (${ms}ms total)`);
}

const random = createSeed<[min: number, max: number]>('min + Math.random() * (max - min)', ['min', 'max']);
const sigmoid = createMap('1 / (1 + Math.exp(-x))');
const add = createFlatOp('a + b');

function variable(shape: number[], inFeatures: number) {
  const k = 1 / inFeatures;
  return random(DataType.f32, shape, -Math.sqrt(k), Math.sqrt(k));
}

function layer(size: number, input_size: number, activation: MapOperation) {
  const weights = variable([size, input_size], input_size);
  const bias = variable([1, size], input_size);

  const weightsT = transpose(weights);
  return {
    variables: { weights, bias },
    forward: (x: NDArray) => activation.inplace(add.inplace(dot(x, weightsT), bias))
  };
}

const input = random(DataType.f32, [1, 3], 0, 1);

const h1 = layer(3, 3, sigmoid);
const h2 = layer(3, 3, sigmoid);
const h3 = layer(2, 3, sigmoid);

const forward = (x: NDArray) => h3.forward(h2.forward(h1.forward(x)));

timeit('forward', () => forward(input), 1000);
