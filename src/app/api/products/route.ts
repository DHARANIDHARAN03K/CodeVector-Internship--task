import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const category = searchParams.get('category');
  const cursorParam = searchParams.get('cursor');

  let cursorObj = undefined;
  if (cursorParam) {
    try {
      // Decode the cursor which is passed as base64 string
      const decoded = Buffer.from(cursorParam, 'base64').toString('utf-8');
      const [createdAtStr, id] = decoded.split('|');
      if (createdAtStr && id) {
        cursorObj = {
          createdAt: new Date(createdAtStr),
          id: id,
        };
      }
    } catch (e) {
      console.error("Invalid cursor format", e);
    }
  }

  // Construct the base where clause
  const whereClause: any = {};
  if (category) {
    whereClause.category = category;
  }

  try {
    const products = await prisma.product.findMany({
      take: limit + 1, // Fetch one extra to know if there's a next page
      where: cursorObj
        ? {
            ...whereClause,
            OR: [
              {
                createdAt: {
                  lt: cursorObj.createdAt,
                },
              },
              {
                createdAt: cursorObj.createdAt,
                id: {
                  lt: cursorObj.id,
                },
              },
            ],
          }
        : whereClause,
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
    });

    let nextCursor = null;
    if (products.length > limit) {
      const nextItem = products.pop(); // Remove the extra item
      if (nextItem) {
        // Create the cursor for the next page
        const cursorString = `${nextItem.createdAt.toISOString()}|${nextItem.id}`;
        nextCursor = Buffer.from(cursorString).toString('base64');
      }
    }

    return NextResponse.json({
      data: products,
      nextCursor,
    });
  } catch (error) {
    console.error("Failed to fetch products", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
