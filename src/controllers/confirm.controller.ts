import { UUID } from 'crypto';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { CustomError } from '../@types/error';
import { PrismaRepository } from '../repositories/prisma.repository';

export async function confirm(request: FastifyRequest, reply: FastifyReply) {
  const prismaRepository = new PrismaRepository();
  // Validação do request body
  const createConfirmSchema = z.object({
    measure_uuid: z.string().uuid(),
    confirmed_value: z.number(),
  });

  const { measure_uuid, confirmed_value } = createConfirmSchema.parse(
    request.body
  );

  // Verifica se o registro existe
  const response = await prismaRepository.findMeasurId(measure_uuid as UUID);

  try {
    // Erro: Measure Not Found
    if (!response) {
      const error: CustomError = new Error() as CustomError;
      error.statusCode = 404;
      error.HTTP = 'PATCH';
      throw error;
    }

    // Erro: Confirmation Duplicate
    if (response.has_confirmed) {
      const error: CustomError = new Error() as CustomError;
      error.statusCode = 409;
      error.HTTP = 'PATCH';
      throw error;
    }

    // Confirmando os dados no BD
    prismaRepository.confirmMeasure(confirmed_value, measure_uuid as UUID);

    return reply.send({ success: true });
  } catch (error) {
    throw error;
  }
}
