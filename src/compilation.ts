type CompiledFunction<TArgs extends [...any[]], TReturn> = (...args: TArgs) => TReturn;

function createFunctionCompiler<TArgs extends [...any[]], TReturn>(
  argNames: string[],
  deps: Record<string, any>
): (code: string) => CompiledFunction<TArgs, TReturn> {
  const depNames = Object.keys(deps);
  const depArray = depNames.map(name => deps[name]);
  const functionArgNames = [...depNames, ...argNames];
  return (code: string) => {
    // console.log(code);
    const _func = new Function(...functionArgNames, code);
    return (...args) => _func(...depArray, ...args);
  };
}

function createCachedCompiledFunction<TKey extends string | number, TArgs extends [...any[]], TReturn>(
  keyFor: (...args: TArgs) => TKey,
  code: (key: TKey) => string,
  argNames: string[],
  deps: Record<string, any> = {}
): CompiledFunction<TArgs, TReturn> {
  const cache: Record<string | number, CompiledFunction<TArgs, TReturn>> = {};
  const compile = createFunctionCompiler<TArgs, TReturn>(argNames, deps);

  return (...args) => {
    const key = keyFor(...args);
    if (cache[key] == null) cache[key] = compile(code(key));
    return cache[key](...args);
  };
}

export { createCachedCompiledFunction, CompiledFunction };
