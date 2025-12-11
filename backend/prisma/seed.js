// backend/prisma/seed.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const rooms = [];

    // 47 single rooms
    for (let i = 1; i <= 47; i++) {
        rooms.push({
            name: `Room ${i}`,          // you can later rename to 101,102... etc.
            type: 'Single',
            price: 1000,                // placeholder, change if needed
            capacity: 1,
            description: 'Standard single room',
            amenities: 'Wifi,TV,AC',
        });
    }

    // 2 double rooms
    for (let i = 48; i <= 49; i++) {
        rooms.push({
            name: `Room ${i}`,
            type: 'Double',
            price: 1500,                // placeholder
            capacity: 2,
            description: 'Standard double room',
            amenities: 'Wifi,TV,AC',
        });
    }

    // insert all rooms
    await prisma.room.createMany({
        data: rooms,
    });

    console.log('✅ Seeded 49 rooms');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
