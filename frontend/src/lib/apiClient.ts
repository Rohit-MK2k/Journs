import { getAuth } from 'firebase/auth';

export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error("Unauthorized: No user logged in");
  }

  const token = await user.getIdToken();

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  // We do not parse json here so we can support streaming and raw responses
  // But we throw on HTTP errors
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response;
};
