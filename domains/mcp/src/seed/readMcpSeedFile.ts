import seedData from '../../seed/mcps.json';

export const readMcpSeedFile = async (): Promise<string> => {
  return JSON.stringify(seedData);
};
