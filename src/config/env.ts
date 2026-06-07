const DEFAULT_API_BASE_URL = 'https://wblg-backend-1007953962746.europe-west1.run.app';
const DEFAULT_GAME_SERVICE_BASE_URL = 'https://plblg-1005982046749.europe-west1.run.app';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
export const GAME_SERVICE_BASE_URL = import.meta.env.VITE_GAME_SERVICE_BASE_URL ?? DEFAULT_GAME_SERVICE_BASE_URL;
