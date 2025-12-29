-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('NONE', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NONE';
