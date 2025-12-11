require("dotenv").config();

console.log("TEST DATABASE_URL =", process.env.DATABASE_URL);

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function main() {
    const db = await prisma.$queryRaw`SELECT current_database() AS db`;
    console.log("Connected to database:", db[0].db);

    const tables = await prisma.$queryRaw`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public';
    `;
    console.log("Tables in public:", tables.map(t => t.table_name));

    const hostname = await prisma.$queryRaw`SELECT inet_server_addr() as host`;
    console.log("Connected host:", hostname[0].host);

    const port = await prisma.$queryRaw`SELECT inet_server_port() as port`;
    console.log("Connected port:", port[0].port);
}

main()
    .catch(err => console.error("TEST ERROR:", err))
    .finally(() => prisma.$disconnect());
