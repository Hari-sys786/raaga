// Raaga streaming configuration
// Only used for audio stream proxying — all metadata calls go directly to APIs
export const STREAM_BASE =
  process.env.EXPO_PUBLIC_STREAM_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://165.232.188.213:3080/api';
