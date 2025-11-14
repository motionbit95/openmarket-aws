const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testDelivery() {
  try {
    console.log('=== Testing Delivery Table ===');

    // Check if delivery exists for order 153
    const delivery = await prisma.delivery.findUnique({
      where: { orderId: BigInt(153) }
    });

    console.log('Delivery for order 153:', delivery);

    // Check all deliveries
    const allDeliveries = await prisma.delivery.findMany();
    console.log('All deliveries:', allDeliveries);

    // Check order with delivery
    const orderWithDelivery = await prisma.order.findUnique({
      where: { id: BigInt(153) },
      include: { Delivery: true }
    });

    console.log('Order 153 with delivery:', orderWithDelivery);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDelivery();