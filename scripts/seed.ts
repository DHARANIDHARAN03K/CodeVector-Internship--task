import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const BATCH_SIZE = 10000;
const TOTAL_PRODUCTS = 200000;

async function main() {
  console.log(`Starting seed: generating ${TOTAL_PRODUCTS} products in batches of ${BATCH_SIZE}...`);
  
  const startTime = Date.now();
  let generatedCount = 0;

  for (let i = 0; i < TOTAL_PRODUCTS / BATCH_SIZE; i++) {
    const batch = Array.from({ length: BATCH_SIZE }).map(() => ({
      name: faker.commerce.productName(),
      category: faker.commerce.department(),
      price: parseFloat(faker.commerce.price()),
      // Simulate historical data so we can test newest-first cursor pagination
      createdAt: faker.date.recent({ days: 30 }),
      updatedAt: new Date(),
    }));

    await prisma.product.createMany({
      data: batch,
    });
    
    generatedCount += BATCH_SIZE;
    console.log(`Inserted ${generatedCount} / ${TOTAL_PRODUCTS} products...`);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✅ Successfully seeded ${TOTAL_PRODUCTS} products in ${durationSec} seconds.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
