const isObject = (ob: unknown): ob is Record<string, unknown> =>
  typeof ob === "object" && ob !== null && !(ob instanceof Date);

export const flattenObject = (
  ob: Record<string, unknown>,
  additionalObjectCheck: (data: unknown) => boolean = () => true
): Record<string, unknown> => {
  const toReturn: Record<string, unknown> = {};

  const isObjectToFlatten = (data: unknown): boolean =>
    isObject(data) && additionalObjectCheck(data);

  for (const i in ob) {
    // eslint-disable-next-line no-prototype-builtins
    if (!ob.hasOwnProperty(i)) continue;

    if (isObjectToFlatten(ob[i])) {
      if (Array.isArray(ob[i])) {
        const obList: Array<unknown> = [];

        (ob[i] as unknown[]).forEach((c: unknown) => {
          if (isObjectToFlatten(c))
            obList.push(flattenObject(c as Record<string, unknown>, additionalObjectCheck));
          else obList.push(c);
        });

        toReturn[i] = obList;
      } else {
        const flatObject = flattenObject(ob[i] as Record<string, unknown>, additionalObjectCheck);
        for (const x in flatObject) {
          // eslint-disable-next-line no-prototype-builtins
          if (!flatObject.hasOwnProperty(x)) continue;

          toReturn[`${i}.${x}`] = flatObject[x];
        }
      }
    } else {
      toReturn[i] = ob[i];
    }
  }
  return toReturn;
};
