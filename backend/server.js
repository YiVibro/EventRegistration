import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

// ─── Load Environment Variables ───────────────────────────────────────────────
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

// Fail-fast on missing critical env vars
if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET is not defined in environment");
  process.exit(1);
}
if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not defined in environment");
  process.exit(1);
}

const client = new MongoClient(MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginEmbedderPolicy: false }));

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:80'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Auth Middleware ──────────────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ─── Input Validation Helpers ─────────────────────────────────────────────────
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validateEventBody = (body) => {
  const { title, description, date, venue, capacity, category } = body;
  const errors = [];
  if (!title || title.trim().length < 3) errors.push('Title must be at least 3 characters');
  if (!description || description.trim().length < 10) errors.push('Description must be at least 10 characters');
  if (!date) errors.push('Date is required');
  else if (isNaN(Date.parse(date))) errors.push('Date must be a valid ISO date string');
  if (!venue || venue.trim().length < 2) errors.push('Venue is required');
  if (!capacity || isNaN(capacity) || Number(capacity) < 1) errors.push('Capacity must be a positive number');
  if (!category) errors.push('Category is required');
  return errors;
};

// ─── Database Bootstrap & Route Registration ───────────────────────────────────
(async () => {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(process.env.DB_NAME || "EventRegistration");
    const eventsCol      = db.collection("Events");
    const registrationsCol = db.collection("Registrations");
    const adminsCol      = db.collection("Admins");

    // Indexes for performance
    await eventsCol.createIndex({ id: 1 }, { unique: true, sparse: true });
    await registrationsCol.createIndex({ eventId: 1, email: 1 }, { unique: true });
    await adminsCol.createIndex({ email: 1 }, { unique: true });

    // ── Seed default admin if none exists ──────────────────────────────────────
    const adminCount = await adminsCol.countDocuments();
    if (adminCount === 0) {
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@1234';
      const hashed = bcrypt.hashSync(defaultPassword, 12);
      await adminsCol.insertOne({
        id: uuidv4(),
        name: 'Super Admin',
        email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@eventsphere.edu',
        password: hashed,
        role: 'admin',
        createdAt: new Date().toISOString(),
      });
      console.log(`🔑 Default admin seeded — email: ${process.env.DEFAULT_ADMIN_EMAIL || 'admin@eventsphere.edu'}`);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  HEALTH CHECK
    // ══════════════════════════════════════════════════════════════════════════
    app.get('/api/health', async (_req, res) => {
      try {
        await db.command({ ping: 1 });
        res.json({
          status: 'OK',
          database: 'connected',
          uptime: Math.floor(process.uptime()),
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development',
        });
      } catch {
        res.status(503).json({ status: 'ERROR', database: 'disconnected' });
      }
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  AUTH ROUTES
    // ══════════════════════════════════════════════════════════════════════════

    // POST /api/auth/login
    app.post('/api/auth/login', async (req, res) => {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      const admin = await adminsCol.findOne({ email: email.toLowerCase().trim() });
      if (!admin || !bcrypt.compareSync(password, admin.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: admin._id.toString(), email: admin.email, role: admin.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
      });
    });

    // POST /api/auth/register-admin  (protected — only existing admins can add admins)
    app.post('/api/auth/register-admin', authMiddleware, async (req, res) => {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required' });
      }
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      const exists = await adminsCol.findOne({ email: email.toLowerCase().trim() });
      if (exists) return res.status(409).json({ error: 'Admin with this email already exists' });

      const hashed = bcrypt.hashSync(password, 12);
      const newAdmin = {
        id: uuidv4(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashed,
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      await adminsCol.insertOne(newAdmin);
      res.status(201).json({ message: 'Admin created successfully', admin: { name: newAdmin.name, email: newAdmin.email } });
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  PUBLIC EVENT ROUTES
    // ══════════════════════════════════════════════════════════════════════════

    // GET /api/events
    app.get('/api/events', async (req, res) => {
      const { category, status, search, page = 1, limit = 20 } = req.query;
      const query = {};

      if (category && category !== 'All') query.category = category;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { venue: { $regex: search, $options: 'i' } },
        ];
      }

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;

      const [events, total] = await Promise.all([
        eventsCol.find(query, { projection: { _id: 0 } })
          .sort({ date: 1 })
          .skip(skip)
          .limit(limitNum)
          .toArray(),
        eventsCol.countDocuments(query),
      ]);

      res.json({ events, total, page: pageNum, pages: Math.ceil(total / limitNum) });
    });

    // GET /api/events/:id
    app.get('/api/events/:id', async (req, res) => {
      const event = await eventsCol.findOne({ id: req.params.id }, { projection: { _id: 0 } });
      if (!event) return res.status(404).json({ error: 'Event not found' });

      const registrationCount = await registrationsCol.countDocuments({ eventId: req.params.id });
      res.json({ ...event, registrationCount });
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  REGISTRATION ROUTES
    // ══════════════════════════════════════════════════════════════════════════

    // POST /api/events/:id/register
    app.post('/api/events/:id/register', async (req, res) => {
      const event = await eventsCol.findOne({ id: req.params.id });
      if (!event) return res.status(404).json({ error: 'Event not found' });
      if (event.status === 'cancelled') return res.status(400).json({ error: 'Event is cancelled' });
      if (event.registered >= event.capacity) return res.status(400).json({ error: 'Event is at full capacity' });

      const { name, email, phone, department, year, rollNumber } = req.body;
      const missing = [];
      if (!name) missing.push('name');
      if (!email) missing.push('email');
      if (!phone) missing.push('phone');
      if (!department) missing.push('department');
      if (!year) missing.push('year');
      if (!rollNumber) missing.push('rollNumber');
      if (missing.length) {
        return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
      }
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      const existing = await registrationsCol.findOne({ eventId: req.params.id, email: email.toLowerCase() });
      if (existing) return res.status(409).json({ error: 'You are already registered for this event' });

      const registration = {
        id: uuidv4(),
        eventId: req.params.id,
        eventTitle: event.title,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        department: department.trim(),
        year: year.toString().trim(),
        rollNumber: rollNumber.trim(),
        registeredAt: new Date().toISOString(),
        ticketId: `TKT-${uuidv4().split('-')[0].toUpperCase()}`,
      };

      await registrationsCol.insertOne(registration);
      await eventsCol.updateOne({ id: req.params.id }, { $inc: { registered: 1 } });

      // Return without MongoDB _id
      const { _id, ...regData } = registration;
      res.status(201).json({ message: 'Registration successful!', registration: regData });
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  ADMIN ROUTES (all protected)
    // ══════════════════════════════════════════════════════════════════════════

    // POST /api/admin/events  — create event
    app.post('/api/admin/events', authMiddleware, async (req, res) => {
      const errors = validateEventBody(req.body);
      if (errors.length) return res.status(400).json({ errors });

      const { title, description, date, venue, capacity, category, image, tags } = req.body;

      const event = {
        id: uuidv4(),
        title: title.trim(),
        description: description.trim(),
        date: new Date(date).toISOString(),
        venue: venue.trim(),
        capacity: Number(capacity),
        registered: 0,
        category,
        image: image || null,
        tags: Array.isArray(tags) ? tags : [],
        status: 'upcoming',
        createdBy: req.admin.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await eventsCol.insertOne(event);
      const { _id, ...eventData } = event;
      res.status(201).json({ message: 'Event created successfully', event: eventData });
    });

    // PUT /api/admin/events/:id  — edit event
    app.put('/api/admin/events/:id', authMiddleware, async (req, res) => {
      const event = await eventsCol.findOne({ id: req.params.id });
      if (!event) return res.status(404).json({ error: 'Event not found' });

      const errors = validateEventBody({ ...event, ...req.body });
      if (errors.length) return res.status(400).json({ errors });

      const allowed = ['title', 'description', 'date', 'venue', 'capacity', 'category', 'image', 'tags', 'status'];
      const updates = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) {
          updates[key] = key === 'date' ? new Date(req.body[key]).toISOString()
                        : key === 'capacity' ? Number(req.body[key])
                        : req.body[key];
        }
      }
      updates.updatedAt = new Date().toISOString();

      await eventsCol.updateOne({ id: req.params.id }, { $set: updates });
      const updated = await eventsCol.findOne({ id: req.params.id }, { projection: { _id: 0 } });
      res.json({ message: 'Event updated successfully', event: updated });
    });

    // DELETE /api/admin/events/:id  — delete event
    app.delete('/api/admin/events/:id', authMiddleware, async (req, res) => {
      const result = await eventsCol.deleteOne({ id: req.params.id });
      if (result.deletedCount === 0) return res.status(404).json({ error: 'Event not found' });
      // Optionally cascade-delete registrations
      await registrationsCol.deleteMany({ eventId: req.params.id });
      res.json({ message: 'Event deleted successfully' });
    });

    // GET /api/admin/events/:id/registrations  — view registrations for event
    app.get('/api/admin/events/:id/registrations', authMiddleware, async (req, res) => {
      const event = await eventsCol.findOne({ id: req.params.id });
      if (!event) return res.status(404).json({ error: 'Event not found' });

      const registrations = await registrationsCol
        .find({ eventId: req.params.id }, { projection: { _id: 0, password: 0 } })
        .toArray();

      res.json({ event: { id: event.id, title: event.title }, registrations, total: registrations.length });
    });

    // GET /api/admin/registrations  — all registrations (admin dashboard overview)
    app.get('/api/admin/registrations', authMiddleware, async (req, res) => {
      const { eventId, search, page = 1, limit = 50 } = req.query;
      const query = {};
      if (eventId) query.eventId = eventId;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { rollNumber: { $regex: search, $options: 'i' } },
        ];
      }

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;

      const [registrations, total] = await Promise.all([
        registrationsCol.find(query, { projection: { _id: 0 } })
          .sort({ registeredAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .toArray(),
        registrationsCol.countDocuments(query),
      ]);

      res.json({ registrations, total, page: pageNum, pages: Math.ceil(total / limitNum) });
    });

    // GET /api/admin/stats  — dashboard statistics
    app.get('/api/admin/stats', authMiddleware, async (req, res) => {
      const [totalEvents, totalRegistrations, upcomingEvents, cancelledEvents] = await Promise.all([
        eventsCol.countDocuments(),
        registrationsCol.countDocuments(),
        eventsCol.countDocuments({ status: 'upcoming' }),
        eventsCol.countDocuments({ status: 'cancelled' }),
      ]);

      const eventsByCategory = await eventsCol.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray();

      const topEvents = await eventsCol.find({}, { projection: { _id: 0, id: 1, title: 1, registered: 1, capacity: 1 } })
        .sort({ registered: -1 })
        .limit(5)
        .toArray();

      res.json({
        totalEvents,
        totalRegistrations,
        upcomingEvents,
        cancelledEvents,
        eventsByCategory,
        topEvents,
      });
    });

    // ══════════════════════════════════════════════════════════════════════════
    //  GLOBAL ERROR HANDLER
    // ══════════════════════════════════════════════════════════════════════════
    app.use((err, req, res, _next) => {
      console.error('Unhandled error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    });

    // 404 for unknown routes
    app.use((req, res) => {
      res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
    });

    // ── Start server ────────────────────────────────────────────────────────────
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 EventSphere API running on port ${PORT}`);
      console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // ── Graceful shutdown ───────────────────────────────────────────────────────
    const shutdown = async (signal) => {
      console.log(`\n${signal} received — shutting down gracefully`);
      await client.close();
      console.log('🔌 MongoDB connection closed');
      process.exit(0);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (error) {
    console.error("❌ Startup error:", error.message);
    await client.close().catch(() => {});
    process.exit(1);
  }
})();