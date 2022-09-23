function createArray<T>(length: number, element: T | ((i: number) => T)): T[] {
  const array: T[] = new Array(length);

  if (typeof element === 'function') {
    for (let i = 0; i < length; i++) {
      array[i] = (element as any)(i);
    }
  } else {
    for (let i = 0; i < length; i++) {
      array[i] = element;
    }
  }

  return array;
}

export { createArray };
