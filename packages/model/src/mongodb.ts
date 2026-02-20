import "reflect-metadata";

export const mongoDbDocumentParamOmitDecorator = "mongoDbParamOmit";

export const MongoDbOmit = (target: any, keyOrContext?: string | any): void => {
  let actualTarget = target;
  let actualKey: string;

  if (typeof keyOrContext === "string") {
    // Old syntax: (target, key)
    actualKey = keyOrContext;
  } else if (keyOrContext?.name) {
    // New syntax: field decorator context
    actualTarget = keyOrContext.constructor?.prototype || target;
    actualKey = keyOrContext.name;
  } else {
    return;
  }

  const mongoDbParamsOmit =
    Reflect.getMetadata(mongoDbDocumentParamOmitDecorator, actualTarget) || [];
  Reflect.defineMetadata(
    mongoDbDocumentParamOmitDecorator,
    [...mongoDbParamsOmit, actualKey],
    actualTarget
  );
};
