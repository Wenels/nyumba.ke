import "dotenv/config";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import pg from "pg";

import authRoutes from "./routes/auth.js";
import listingsRoutes from "./routes/listings.js";
import photosRoutes from "./routes/photos.js";
const app = express();
const PgSession = connectPgSimple(session);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

app.use(
  session({
    store: new PgSession({ pool, tableName: "session", createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingsRoutes);
// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));
app.use("/api/listings", photosRoutes);


app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Nyumba.ke API running on http://localhost:${PORT}`);
});
