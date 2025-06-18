import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';

const app = express();
const PORT = 3001;

// Middleware setup
app.use(morgan('dev')); // HTTP request logging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Session configuration
app.use(session({
  secret: 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: false // set to true in production with HTTPS
  }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration (placeholder - implementeremo dopo il database)
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    // TODO: Implementare dopo setup database
    console.log('Login attempt:', email);
    return done(null, false, { message: 'Database not yet configured' });
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  // TODO: Implementare dopo setup database
  done(null, { id, email: 'placeholder' });
});

// Middleware per autenticazione
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// Test routes
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server connesso con tutte le dipendenze!', 
    timestamp: new Date().toISOString(),
    session: req.session.id
  });
});

// Auth routes (placeholder)
app.post('/api/auth/login', 
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info.message });
      
      req.logIn(user, (err) => {
        if (err) return next(err);
        return res.json({ user, message: 'Login successful' });
      });
    })(req, res, next);
  }
);

app.post('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logout successful' });
  });
});

app.get('/api/auth/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Protected test route
app.get('/api/protected', isAuthenticated, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Morgan logging enabled`);
  console.log(`🔐 Passport.js configured`);
  console.log(`🔄 CORS enabled for http://localhost:5173`);
});