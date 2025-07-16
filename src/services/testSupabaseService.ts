// This is a test-only service that bypasses the normal authentication flow
// and directly calls MCP Supabase tools for testing purposes

export const mcp_supabase_execute_sql = async (projectId: string, query: string) => {
  // In a real test environment, this would call the actual MCP tool
  // For now, we'll simulate the response structure
  
  console.log(`Executing test query on project ${projectId}:`, query);
  
  // Simulate a plants query response
  if (query.includes('FROM plants')) {
    return {
      data: [
        {
          id: '1',
          name: 'Pothos',
          nickname: 'Mi Pothos Verde',
          species: 'Epipremnum aureum',
          location: 'Sala de estar',
          plant_environment: 'interior',
          light_requirements: 'luz_indirecta',
          health_score: 85,
          last_watered: '2024-01-15T10:00:00Z',
          care_profile: { wateringFrequency: 7 },
          date_added: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'Monstera',
          nickname: 'Monstera Gigante',
          species: 'Monstera deliciosa',
          location: 'Habitación',
          plant_environment: 'interior',
          light_requirements: 'luz_indirecta',
          health_score: 92,
          last_watered: '2024-01-14T10:00:00Z',
          care_profile: { wateringFrequency: 10 },
          date_added: '2024-01-02T00:00:00Z'
        },
        {
          id: '3',
          name: 'Sansevieria',
          nickname: 'Lengua de Suegra',
          species: 'Sansevieria trifasciata',
          location: 'Oficina',
          plant_environment: 'interior',
          light_requirements: 'poca_luz',
          health_score: 78,
          last_watered: '2024-01-10T10:00:00Z',
          care_profile: { wateringFrequency: 14 },
          date_added: '2024-01-03T00:00:00Z'
        }
      ],
      error: null
    };
  }
  
  // Default empty response
  return {
    data: [],
    error: null
  };
}; 