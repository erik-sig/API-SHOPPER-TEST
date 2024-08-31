import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { env } from '../../env';
import { CustomError } from '../@types/error';

export function errorHandler(
  error: CustomError | ZodError,
  _: FastifyRequest,
  reply: FastifyReply
) {
  if (error instanceof ZodError) {
    return reply
      .status(400)
      .send({ error_code: 'INVALID_DATA', error_description: error.issues });
  }

  //TRATAMENTO DE ERROS DE GET
  if (error.statusCode === 404 && error.HTTP === 'GET') {
    return reply.status(409).send({
      error_code: 'MEASURES_NOT_FOUND',
      error_description: 'Nenhuma leitura encontrada',
    });
  }

  //TRATAMENTO DE ERROS DE POST
  if (error.statusCode === 409 && error.HTTP === 'POST') {
    return reply.status(409).send({
      error_code: 'DOUBLE_REPORT',
      error_description: 'LEITURA DO MÊS JÁ REALIZADA',
    });
  }

  //TRATAMENTO DE ERROS DE PATCH
  if (error.statusCode === 404 && error.HTTP === 'PATCH') {
    return reply.status(404).send({
      error_code: 'MEASURE_NOT_FOUND',
      error_description: 'LEITURA DO MÊS JÁ REALIZADA',
    });
  }

  if (error.statusCode === 409 && error.HTTP === 'PATCH') {
    return reply.status(409).send({
      error_code: 'CONFIRMATION_DUPLICATE',
      error_description: 'LEITURA DO MÊS JÁ REALIZADA',
    });
  }

  if (env.NODE_ENV !== 'production') {
    console.error(error);
  } else {
    //LOG DE ERROS
  }

  return reply.status(500).send({ message: 'Internal server error.' });
}
