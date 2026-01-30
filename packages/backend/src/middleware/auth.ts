import { Request, Response, NextFunction } from 'express';

/**
 * Simple API key authentication middleware
 *
 * Can be disabled by setting API_AUTH_ENABLED=false
 * Checks for API key in Authorization header: "Bearer <your-api-key>"
 */

// Clerk integration
export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  // Check if auth is enabled
  const authEnabled = process.env.API_AUTH_ENABLED !== 'false';

  if (!authEnabled) {
    // Auth disabled, allow all requests
    return next();
  }
  // Get the API key from env
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    console.warn('[Auth] API_AUTH_ENABLED=true but API_KEY is not set. Allowing request.');
    return next();
  }

  // Get Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing Authorization header',
    });
  }

  // Check if it's a Bearer token
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid Authorization header format. Expected: Bearer <api-key>',
    });
  }

  const providedKey = parts[1];

  // Compare API keys
  if (providedKey !== validApiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key',
    });
  }

  // Valid API key, proceed
  next();
}
