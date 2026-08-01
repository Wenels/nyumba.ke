import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  const defaultPassword = await bcrypt.hash("Password123!", 10);
  const adminPassword = await bcrypt.hash("Admin@2025!", 10);

  // 1. Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@nyumba.ke" },
    update: { passwordHash: adminPassword, verification: "VERIFIED" },
    create: {
      email: "admin@nyumba.ke",
      fullName: "Nyumba Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
      isAdmin: true,
      phoneVerified: true,
      verification: "VERIFIED",
    },
  });

  // 2. Landlord
  const landlord = await prisma.user.upsert({
    where: { email: "kamunyalandlord@gmail.com" },
    update: { passwordHash: defaultPassword, verification: "VERIFIED" },
    create: {
      email: "kamunyalandlord@gmail.com",
      fullName: "Samuel Maina Gachuru (Landlord)",
      passwordHash: defaultPassword,
      role: "LANDLORD",
      phoneVerified: true,
      verification: "VERIFIED",
    },
  });

  // 3. Tenant
  const tenant = await prisma.user.upsert({
    where: { email: "ketttenant@gmail.com" },
    update: { passwordHash: defaultPassword, verification: "VERIFIED" },
    create: {
      email: "ketttenant@gmail.com",
      fullName: "Samuel Maina Gachuru (Tenant)",
      passwordHash: defaultPassword,
      role: "TENANT",
      phoneVerified: true,
      verification: "VERIFIED",
    },
  });

  console.log("✅ User accounts verified & updated:");
  console.log("-----------------------------------------");
  console.log("1. ADMIN");
  console.log("   Email   : admin@nyumba.ke");
  console.log("   Password: Admin@2025!");
  console.log("-----------------------------------------");
  console.log("2. LANDLORD");
  console.log("   Email   : kamunyalandlord@gmail.com");
  console.log("   Password: Password123!");
  console.log("-----------------------------------------");
  console.log("3. TENANT");
  console.log("   Email   : ketttenant@gmail.com");
  console.log("   Password: Password123!");
  console.log("-----------------------------------------");
}

main()
  .catch((e) => { console.error("Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
