// backend/seed-rooms.js
// Run: node seed-rooms.js
// Creates all 49 rooms for EDU Hotel Kat 2

require('dotenv').config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🏨 Seeding EDU Hotel rooms...\n");

  // All room numbers for Kat 2
  // 47 single + 2 double (210, 242)
  const allRoomNumbers = [
    201, 203, 204, 205, 206, 207, 208, 209, 210, 211,
    212, 213, 214, 215, 216, 217, 219, 220, 221, 222,
    223, 224, 225, 226, 227, 228, 229, 230, 231, 232,
    233, 234, 235, 236, 237, 238, 239, 240, 241, 242,
    243, 244, 245, 246, 247, 248, 249, 250, 251,
  ];

  const doubleRooms = [210, 242]; // double rooms

  let created = 0;
  let skipped = 0;

  for (const num of allRoomNumbers) {
    const name = String(num);
    const isDouble = doubleRooms.includes(num);

    // Check if room already exists
    const existing = await prisma.room.findFirst({ where: { name } });
    if (existing) {
      console.log(`  ⏭️  Room ${name} already exists (id: ${existing.id}), skipping.`);
      skipped++;
      continue;
    }

    const room = await prisma.room.create({
      data: {
        name,
        type: isDouble ? "DOUBLE" : "SINGLE",
        price: isDouble ? 450 : 300,
        capacity: isDouble ? 2 : 1,
        description: `EDU Hotel Kat 2 - Room ${name} (${isDouble ? "Double" : "Single"})`,
        amenities: "Wi-Fi, TV, Mini-bar, Air Conditioning",
        status: "AVAILABLE",
      },
    });

    console.log(`  ✅ Created Room ${room.name} (${room.type}) - id: ${room.id}`);
    created++;
  }

  // Create Admin User
  const adminEmail = process.env.ADMIN_SEED_EMAIL;
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;

  if (!adminEmail || !adminPassword) {
    if (process.env.NODE_ENV === "production") {
      console.error("❌ ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set in production.");
      process.exit(1);
    }
    console.warn("⚠️  ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD not set — skipping admin seed in non-production.");
  }
  
  if (adminEmail && adminPassword) {
    const bcrypt = require("bcrypt");
    const hashed = await bcrypt.hash(adminPassword, 10);
    
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        password: hashed,
        name: "Super Admin",
        role: "ADMIN",
        userType: "STAFF",
      }
    });
    console.log(`\n👨‍💼 Admin user ensured: ${adminEmail}`);
  }

  console.log(`\n📊 Summary: ${created} created, ${skipped} skipped (already existed)`);
  console.log(`📦 Total rooms in database: ${await prisma.room.count()}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });