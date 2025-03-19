// Define API URL based on environment
const getApiUrl = () => {
  // In production, use relative URL
  if (import.meta.env.NODE_ENV === "production" || 
      import.meta.env.PROD) {
    return "/api";
  }
  // In development, use localhost with port from env variable or default
  const devPort = import.meta.env.REACT_APP_API_PORT || 5000;
  return `http://localhost:${devPort}/api`;
};
export const API_URL = getApiUrl();
