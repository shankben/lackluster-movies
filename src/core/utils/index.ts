import { capitalize, decaptialize } from "./capitalize";
import { putOp, updateExpression, expressionAttributes } from "./dynamodb";

export const tryMakeNumber = (it: string): string | number => {
  try {
    if (it === "") return it;
    const res = Number(it);
    return isNaN(res) ? it as string : res as number;
  } catch (err) {
    return it;
  }
};

export const tryMakeDateString = (it: string) => {
  try {
    const d = new Date(it);
    if (isNaN(Number(d))) throw new Error();
    return d.toISOString();
  } catch (err) {
    return it;
  }
};

export const tryFormatCurrency = (it: string) => {
  try {
    return !/^\$/.test(it) ? it : parseFloat(it.replace(/[ ,$]/ig, ""));
  } catch (err) {
    return it;
  }
};

export const remapKey = (
  it: Record<string, any>,
  from: string,
  to: string
): Record<string, any> => {
  if (from in it) {
    it[to] = it[from];
    delete it[from];
  }
  return it;
};

export {
  capitalize,
  decaptialize,
  putOp,
  updateExpression,
  expressionAttributes
};
