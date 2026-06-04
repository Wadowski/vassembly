const isObject = (ob: any): ob is Record<string, any> =>
  typeof ob === "object" && ob !== null && !(ob instanceof Date);

export const flattenObject = (
  ob: Record<string, any>,
  additionalObjectCheck: (data: any) => boolean = () => true
): Record<string, any> => {
  const toReturn: Record<string, any> = {};

  const isObjectToFlatten = (data: any): boolean =>
    isObject(data) && additionalObjectCheck(data);

  for (const i in ob) {
    // eslint-disable-next-line no-prototype-builtins
    if (!ob.hasOwnProperty(i)) continue;

    if (isObjectToFlatten(ob[i])) {
      if (Array.isArray(ob[i])) {
        const obList: Array<any> = [];

        ob[i].forEach((c: any) => {
          if (isObjectToFlatten(c))
            obList.push(flattenObject(c, additionalObjectCheck));
          else obList.push(c);
        });

        toReturn[i] = obList;
      } else {
        const flatObject = flattenObject(ob[i], additionalObjectCheck);
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
