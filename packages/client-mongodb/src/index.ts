import { mongoDb } from "./connection";

export const init = async () => mongoDb.connect();
