-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ConsultationRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "birthDate" DATETIME NOT NULL,
    "birthTime" TEXT NOT NULL,
    "birthPlace" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "timezone" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "planId" TEXT,
    "amountPaise" INTEGER,
    "paymentStatus" TEXT NOT NULL DEFAULT 'not_required',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "paidAt" DATETIME
);
INSERT INTO "new_ConsultationRequest" ("birthDate", "birthPlace", "birthTime", "createdAt", "email", "id", "latitude", "longitude", "message", "name", "phone", "status", "timezone") SELECT "birthDate", "birthPlace", "birthTime", "createdAt", "email", "id", "latitude", "longitude", "message", "name", "phone", "status", "timezone" FROM "ConsultationRequest";
DROP TABLE "ConsultationRequest";
ALTER TABLE "new_ConsultationRequest" RENAME TO "ConsultationRequest";
CREATE UNIQUE INDEX "ConsultationRequest_razorpayOrderId_key" ON "ConsultationRequest"("razorpayOrderId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
