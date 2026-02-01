import { Logger } from "./types";
import { inspect } from "node:util";
import Color from "cli-color";

export const logger: Logger = (message, { data, meta }) => {
  console.log(
    `${message} ${Color.blackBright(
      inspect(
        { meta, ...(data ? { data } : {}) },
        { compact: true, showHidden: false, depth: null, breakLength: Infinity }
      )
    )}`
  );
};
