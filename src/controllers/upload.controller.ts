import { randomUUID } from 'crypto';
import { FastifyReply, FastifyRequest } from 'fastify';
import fs from 'fs';
import { z } from 'zod';
import { CustomError } from '../@types/error';
import { promptGemini } from '../lib/geminiAPI';
import { PrismaRepository } from '../repositories/prisma.repository';
import isNotTheSameMonth from '../utils/isNotTheSameMonth';

export async function upload(request: FastifyRequest, reply: FastifyReply) {
  const prismaRepository = new PrismaRepository();
  // Validação do Request Body
  const createMeterSchema = z.object({
    image: z.string().base64(),
    customer_code: z.string(),
    measure_datetime: z.coerce.date(),
    measure_type: z.enum(['WATER', 'GAS']),
  });

  const { image, customer_code, measure_datetime, measure_type } =
    createMeterSchema.parse(request.body);

  // Tratando e Salvando a Imagem no Próprio Servidor
  const imageBase64 = image.split(';base64,').pop();
  const filePath = `public/${Date.now()}.png`;

  try {
    await fs.promises.writeFile(filePath, imageBase64 as string, 'base64');
    console.log('Imagem salva com sucesso!');
  } catch (err) {
    console.error('Erro ao salvar a imagem:', err);
    return reply.status(500).send({ error: 'Erro ao salvar a imagem' });
  }

  // Resposta da LLM
  let geminiResult;
  try {
    const responseOfGemini = await promptGemini(image);
    geminiResult = Number(responseOfGemini.response.text());
    if (isNaN(geminiResult)) {
      throw new Error('Resposta inválida da LLM');
    }
  } catch (err) {
    return reply
      .status(500)
      .send({ error: 'Erro ao processar a resposta da LLM' });
  }

  // Validação da Resposta
  const responseMeaterSchema = z.object({
    measure_value: z.number(),
    image_url: z.string(),
    measure_uuid: z.string().uuid(),
  });

  const image_url = `localhost:3333/files/${filePath}`;
  const measure_uuid = randomUUID();

  const response = {
    measure_value: geminiResult,
    image_url,
    measure_uuid,
  };

  responseMeaterSchema.parse(response);

  // Encontrando a Última Medida Feita pelo Cliente
  const lastCustomerMeasure = await prismaRepository.lastCustomerMeasure(
    customer_code
  );

  // const lastCustomerMeasure = await prisma.measur.findFirst({
  //   where: {
  //     customerId: customer_code,
  //   },
  //   orderBy: {
  //     measure_datetime: 'desc',
  //   },
  // });

  // Verifica se Já Tem uma Leitura no Mês
  if (
    lastCustomerMeasure &&
    !isNotTheSameMonth(lastCustomerMeasure?.measure_datetime, measure_datetime)
  ) {
    const error: CustomError = new Error(
      'Já existe uma leitura para este mês.'
    );
    error.HTTP = 'POST';
    error.statusCode = 409;
    throw error;
  }

  //Valida e Salva no Banco de Dados a Medida
  const customerExists = await prismaRepository.findCustomerId(customer_code);

  if (!customerExists) {
    const data = {
      id: customer_code,
      measur: {
        measure_uuid,
        measure_type,
        image_url,
        has_confirmed: false,
        measure_value: geminiResult,
        measure_datetime,
      },
    };
    prismaRepository.createCustomerAndMeasur(data);
  } else {
    const data = {
      measure_uuid,
      measure_type,
      image_url,
      has_confirmed: false,
      measure_value: geminiResult,
      measure_datetime,
      customerId: customer_code,
    };
    prismaRepository.createMeasur(data);
  }

  reply.send({
    image_url,
    measure_value: geminiResult,
    measure_uuid,
  });
}
