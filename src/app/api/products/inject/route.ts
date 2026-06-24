import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const categories = ['Electronics', 'Clothing', 'Home', 'Sports', 'Books'];

export async function POST() {
  try {
    const productsToInject = [];
    const now = new Date();
    
    // Generate 50 fresh products with exactly the current timestamp
    for (let i = 0; i < 50; i++) {
      productsToInject.push({
        name: faker.commerce.productName(),
        category: categories[Math.floor(Math.random() * categories.length)],
        price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
        createdAt: now,
        updatedAt: now,
      });
    }

    await prisma.product.createMany({
      data: productsToInject,
    });

    return NextResponse.json({ success: true, count: 50, timestamp: now });
  } catch (error) {
    console.error("Failed to inject products", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
