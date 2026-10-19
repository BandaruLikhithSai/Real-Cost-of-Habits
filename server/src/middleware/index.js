import jwt from 'jsonwebtoken';
export const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = req.cookies?.token || headerToken;
    if (!token) throw new Error('No token provided');
    req.userId = jwt.verify(token, process.env.JWT_SECRET).sub;
    next();
  } catch {
    res.status(401).json({ error: { code: 'unauthorized', message: 'Sign in required' } });
  }
};
export const validate = (schema, src = 'body') => (req, res, next) => {
  const r = schema.safeParse(req[src]);
  if (!r.success) return res.status(400).json({ error: { code: 'validation', message: 'Invalid input', fields: r.error.flatten().fieldErrors } });
  req[src] = r.data; next();
};
export const errorHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: { code: 'server_error', message: err.status ? err.message : 'Something went wrong' } });
};
