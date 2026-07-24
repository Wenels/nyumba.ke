import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

const ADMIN_EMAIL    = "admin@nyumba.ke";
const ADMIN_PASSWORD = "Admin@2025!";
const ADMIN_NAME     = "Nyumba Admin";

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    console.log(`⚠️  Admin already exists: ${existing.email} (id: ${existing.id})`);
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.user.create({
    data: {
      email:         ADMIN_EMAIL,
      fullName:      ADMIN_NAME,
      passwordHash,
      role:          "ADMIN",
      isAdmin:       true,
      phoneVerified: true,
      verification:  "VERIFIED",
    },
  });

  console.log("✅  Admin user created successfully!");
  console.log(`   Email    : ${admin.email}`);
  console.log(`   Password : ${ADMIN_PASSWORD}`);
  console.log(`   ID       : ${admin.id}`);
  console.log(`   Role     : ${admin.role}`);
}

main()
  .catch((e) => { console.error("❌  Error:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
