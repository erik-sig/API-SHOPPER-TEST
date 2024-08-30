-- CreateTable
CREATE TABLE "customer" (
    "id" TEXT NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measur" (
    "id" TEXT NOT NULL,
    "has_confirmed" BOOLEAN NOT NULL,
    "type" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,

    CONSTRAINT "measur_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "measur" ADD CONSTRAINT "measur_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
