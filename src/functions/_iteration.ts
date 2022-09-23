function generateSlowIteration(
  dimensions: number,
  arrays: string[],
  offsets: string[],
  extraCode?: {
    start?: (dimension: number) => string;
    pre?: (dimension: number) => string;
    post?: (dimension: number) => string;
    end?: (dimension: number) => string;
  }
): string {
  let code = arrays.map((array, i) => `var ${offsets[i]} = ${array}.offset;\n`).join('');

  for (let i = 0; i < dimensions; i++) {
    if (extraCode?.start) code += extraCode.start(i) + '\n';
    code += `for (var i${i} = 0; i${i} < ${arrays[0]}.shape[${i}]; i${i}++) {\n`;
    if (extraCode?.pre) code += extraCode.pre(i) + '\n';
  }

  for (let i = dimensions - 1; i >= 0; i--) {
    if (extraCode?.post) code += extraCode.post(i) + '\n';
    for (let j = 0; j < arrays.length; j++) {
      code += `${offsets[j]} += ${arrays[j]}.strides[${i}];\n`;
    }
    code += '}\n';
    if (extraCode?.end) code += extraCode.end(i) + '\n';
    if (i == 0) break;
    for (let j = 0; j < arrays.length; j++) {
      code += `${offsets[j]} -= ${arrays[j]}.shape[${i}] * ${arrays[j]}.strides[${i}];\n`;
    }
  }

  return code;
}

function generateFastIteration(arrays: string[], offsets: string[], extraCode: string): string {
  return `
    ${arrays.map((array, i) => `var ${offsets[i]} = ${array}.offset;`).join('\n')}
    for (var i = 0; i < ${arrays[0]}.size; i++) {
      ${extraCode}
      ${offsets.map(offset => `${offset}++;`).join('\n')}
    }
  `;
}

function generateOptimalUnalignedIteration(
  dimensions: number,
  arrays: string[],
  offsets: string[],
  extraCode: (isFast: boolean) => string
): string {
  return `
    if (${arrays.map(array => `${array}.isContiguous`).join(' && ')}) {
      ${generateFastIteration(arrays, offsets, extraCode(true))}
    } else {
      ${generateSlowIteration(dimensions, arrays, offsets, {
        pre: i => (i == dimensions - 1 ? extraCode(false) : '')
      })}
    }
  `;
}

function generateOptimalIteration(
  dimensions: number,
  arrays: string[],
  offsets: string[],
  extraCode: (isFast: boolean) => string
): string {
  return `
    if (${arrays.map(array => `${array}.isAligned && ${array}.isContiguous`).join(' && ')}) {
      ${generateFastIteration(arrays, offsets, extraCode(true))}
    } else {
      ${generateSlowIteration(dimensions, arrays, offsets, {
        pre: i => (i == dimensions - 1 ? extraCode(false) : '')
      })}
    }
  `;
}

export { generateOptimalIteration, generateOptimalUnalignedIteration, generateFastIteration, generateSlowIteration };
