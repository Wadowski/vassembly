import seedData from '../../seed/systemAgents.json';

export const readSystemAgentSeedFile = async (): Promise<string> => {
  return JSON.stringify(seedData);
};
