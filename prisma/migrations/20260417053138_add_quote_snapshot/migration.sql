-- CreateTable
CREATE TABLE "QuoteSnapshot" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "previousClose" DECIMAL(10,2) NOT NULL,
    "changePercent" DECIMAL(8,4) NOT NULL,
    "dayHigh" DECIMAL(10,2) NOT NULL,
    "dayLow" DECIMAL(10,2) NOT NULL,
    "volume" BIGINT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteSnapshot_pkey" PRIMARY KEY ("id")
);
