-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('STUDENT', 'STAFF', 'SPECIAL_GUEST', 'OTHER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'HOTEL_STAFF');

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "guestType" "UserType" NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "userType" "UserType" NOT NULL DEFAULT 'OTHER';
