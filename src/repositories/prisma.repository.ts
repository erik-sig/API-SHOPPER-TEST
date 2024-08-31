import { $Enums, Prisma } from '@prisma/client';
import { UUID } from 'crypto';
import { prisma } from '../lib/prisma';

export class PrismaRepository {
  async findMeasurId(measure_uuid: UUID) {
    const response = await prisma.measur.findUnique({
      where: { measure_uuid },
    });
    return response;
  }

  async findCustomerId(customerId: string) {
    const response = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    return response;
  }

  async createCustomerAndMeasur({
    measur,
    id,
  }: {
    measur: Prisma.measurCreateWithoutCustomer_idInput;
    id: string;
  }) {
    await prisma.customer.create({
      data: {
        id,
        measur: {
          create: measur,
        },
      },
    });
  }

  async createMeasur(measur: Prisma.measurUncheckedCreateInput) {
    await prisma.measur.create({
      data: measur,
    });
  }

  async lastCustomerMeasure(customer_code: string) {
    const lastCustomerMeasure = await prisma.measur.findFirst({
      where: {
        customerId: customer_code,
      },
      orderBy: {
        measure_datetime: 'desc',
      },
    });
    return lastCustomerMeasure;
  }

  async confirmMeasure(confirmed_value: number, measure_uuid: UUID) {
    await prisma.measur.update({
      where: { measure_uuid },
      data: {
        has_confirmed: true,
        measure_value: confirmed_value,
      },
    });
  }
  async findManyMeasures(
    customer_code: string,
    measure_type?: $Enums.MeasureType
  ) {
    const response = await prisma.measur.findMany({
      where: {
        customerId: customer_code,
        ...(measure_type && { measure_type }), // Adiciona a condição se measure_type estiver presente
      },
      select: {
        measure_uuid: true,
        measure_datetime: true,
        measure_type: true,
        has_confirmed: true,
        image_url: true,
      },
    });
    return response;
  }
}
