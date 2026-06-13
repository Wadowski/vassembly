import "reflect-metadata";

export const mongoDbDocumentParamOmitDecorator = "mongoDbParamOmit";

interface MongoDbFieldDecoratorContext {
  name: string;
  constructor?: { prototype?: object };
}

export const MongoDbOmit = (
  target: object,
  keyOrContext?: string | MongoDbFieldDecoratorContext
): void => {
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
