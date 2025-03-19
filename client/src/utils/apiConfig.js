const getApiUrl = () => {
  if (import.meta.env.NODE_ENV === "production" || 
      import.meta.env.PROD) {
    return "/api";
  }
  const devPort = import.meta.env.REACT_APP_API_PORT || 5000;
  return `http://localhost:${devPort}/api`;
};
export const API_URL = getApiUrl();
