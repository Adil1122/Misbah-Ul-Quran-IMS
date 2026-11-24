// Vercel Serverless Function entry point
// Bridges the existing Express application directly into Vercel Serverless Functions
// without requiring framework migrations or architectural rewrites.

import app from '../server.ts';

export default app;
