export const BASE_SERVER_URL = 
  import.meta.env.VITE_API_URL || 
  (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" 
    ? "https://nirmanapi.rdmp.in/api" 
    : "http://localhost:3000/api");
