const isObject = (ob: any) =>
  typeof ob === "object" && ob !== null && !(ob instanceof Date);

export const flattenObject = (
  ob: any,
  additionalObjectCheck: (data: any) => boolean = () => true
) => {
  const toReturn = {};

  const isObjectToFlatten = (data: any) =>
    isObject(data) && additionalObjectCheck(data);

  for (const i in ob) {
    // eslint-disable-next-line no-prototype-builtins
    if (!ob.hasOwnProperty(i)) continue;

    if (isObjectToFlatten(ob[i])) {
      if (Array.isArray(ob[i])) {
        const obList = [];

        ob[i].forEach((c) => {
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
