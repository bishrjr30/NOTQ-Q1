import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68b01fdf7ff5f03db59e7e33", 
  requiresAuth: true // Ensure authentication is required for all operations
});
