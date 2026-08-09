import "dotenv/config";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import conversationsRoutes from "./routes/conversations.js";
import adminRoutes from "./routes/admin.js";
import cors from "cors";
import pg from "pg";
import passwordResetRoutes from "./routes/passwordReset.js";
import authRoutes from "./routes/auth.js";
import listingsRoutes from "./routes/listings.js";
import savedRoutes from "./routes/saved.js";
import photosRoutes from "./routes/photos.js";
import bookingsRoutes from "./routes/bookings.js";
import contractsRoutes from "./routes/contracts.js";
import rentPaymentsRoutes from "./routes/rentPayments.js";
import issuesRoutes from "./routes/issues.js";
import amenitiesRoutes from "./routes/amenities.js";
import tenantsRoutes from "./routes/tenants.js";
import { prisma } from "./lib/prisma.js";
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
app.use("/api/conversations", conversationsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/properties", listingsRoutes);
app.use("/api/saved", savedRoutes);
app.use("/api/password-reset", passwordResetRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/contracts", contractsRoutes);
app.use("/api/rent-payments", rentPaymentsRoutes);
app.use("/api/issues", issuesRoutes);
app.use("/api/listings", amenitiesRoutes);
app.use("/api/properties", amenitiesRoutes);
app.use("/api/tenants", tenantsRoutes);
app.use("/uploads/issues", express.static("uploads/issues"));
app.use("/uploads", express.static("uploads"));
app.use("/api/listings", photosRoutes);
app.use("/api/properties", photosRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Nyumba.ke API running on http://localhost:${PORT}`);
});

// Background job: cancel PAYMENT_PENDING bookings older than 30 minutes
setInterval(async () => {
  try {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 mins ago
    const result = await prisma.booking.updateMany({
      where: { status: "PAYMENT_PENDING", createdAt: { lt: cutoff } },
      data: { status: "CANCELLED" }
    });
    if (result.count > 0) {
      console.log(`[Job] Cancelled ${result.count} expired PAYMENT_PENDING bookings.`);
    }
  } catch (err) {
    console.error("[Job] Error cleaning up bookings:", err);
  }
}, 5 * 60 * 1000); // Runs every 5 minutes
