export const GET_SYSTEM_AGENT_PREFERENCE_QUERY = `
  query GetSystemAgentPreference {
    systemAgentPreference {
      userId
      integrationCredentialId
      updatedAt
    }
  }
`;
