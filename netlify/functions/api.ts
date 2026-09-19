// Netlify Function entry: all logic lives in Backend/src so bare imports (express, pg, ...) resolve from Backend/node_modules.
export { handler } from '../../Backend/src/serverless';
