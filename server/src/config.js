/** Étape 1 du plan MVP — ports Vite playfield / backglass / dmd (+ 127.0.0.1 en local). */
export const PORT = 3000;

export const CORS_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
];
export function getSocketIoCors() {
  return {
    origin: CORS_ORIGINS,
    methods: ["GET", "POST"],
  };
}
