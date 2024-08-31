import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { CustomError } from '../@types/error';
import { PrismaRepository } from '../repositories/prisma.repository';

export async function getList(request: FastifyRequest, reply: FastifyReply) {
  const prismaRepository = new PrismaRepository();
  // Validação da query params com case insensitive
  const queryParamsSchema = z.object({
    measure_type: z
      .preprocess((val) => {
        if (typeof val === 'string') {
          return val.toUpperCase();
        }
        return val;
      }, z.enum(['WATER', 'GAS'], { message: 'Tipo de medição não permitida' }))
      .optional(),
  });

  const { measure_type } = queryParamsSchema.parse(request.query);

  // Validação da request params
  const requestParamsSchema = z.object({
    customer_code: z.string(),
  });

  const { customer_code } = requestParamsSchema.parse(request.params);

  try {
    // Filtragem e consulta ao banco de dados
    const responseOfDB = await prismaRepository.findManyMeasures(
      customer_code,
      measure_type
    );

    if (responseOfDB.length === 0) {
      const error: CustomError = new Error() as CustomError;
      error.statusCode = 404;
      error.HTTP = 'GET';
      throw error;
    }

    // Resposta formatada
    const responseList = {
      customer_code,
      measures: responseOfDB,
    };

    return reply.send(responseList);
  } catch (error) {
    throw error;
  }
}
