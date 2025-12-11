require("dotenv").config(); // make sure env is loaded

console.log(">>> RUNTIME DATABASE_URL =", process.env.DATABASE_URL);

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL, // force this URL
        },
    },
});

module.exports = prisma;
