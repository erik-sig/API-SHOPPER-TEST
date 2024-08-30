import { randomUUID } from 'crypto';
import { FastifyReply, FastifyRequest } from 'fastify';
import fs from 'fs';
import { z } from 'zod';
import { CustomError } from '../@types/error';
import { app } from '../app';
import { promptGemini } from '../lib/geminiAPI';
import { prisma } from '../lib/prisma';
import isNotTheSameMonth from '../utils/isNotTheSameMonth';

export default async function serviceRoutes() {
  app.get(
    '/:customer_code/list',
    async (request: FastifyRequest, reply: FastifyReply) => {
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
        let responseOfDB = await prisma.measur.findMany({
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

        // Erro: Measures Not Found
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
  );

  app.patch(
    '/confirm',
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Validação do request body
      const createConfirmSchema = z.object({
        measure_uuid: z.string().uuid(),
        confirmed_value: z.number(),
      });

      const { measure_uuid, confirmed_value } = createConfirmSchema.parse(
        request.body
      );

      // Verifica se o registro existe
      const response = await prisma.measur.findUnique({
        where: { measure_uuid },
      });

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
        await prisma.measur.update({
          where: { measure_uuid },
          data: {
            has_confirmed: true,
            measure_value: confirmed_value,
          },
        });

        return reply.send({ success: true });
      } catch (error) {
        throw error;
      }
    }
  );

  app.post('/upload', async (request: FastifyRequest, reply: FastifyReply) => {
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
    const lastCustomerMeasure = await prisma.measur.findFirst({
      where: {
        customerId: customer_code,
      },
      orderBy: {
        measure_datetime: 'desc',
      },
    });

    // Verifica se Já Tem uma Leitura no Mês
    if (
      lastCustomerMeasure &&
      !isNotTheSameMonth(
        lastCustomerMeasure?.measure_datetime,
        measure_datetime
      )
    ) {
      const error: CustomError = new Error(
        'Já existe uma leitura para este mês.'
      );
      error.HTTP = 'POST';
      error.statusCode = 409;
      throw error;
    }

    //Valida e Salva no Banco de Dados a Medida
    const customerExists = await prisma.customer.findUnique({
      where: {
        id: customer_code,
      },
    });

    if (!customerExists) {
      await prisma.customer.create({
        data: {
          id: customer_code,
          measur: {
            create: {
              measure_uuid,
              measure_type,
              image_url,
              has_confirmed: false,
              measure_value: geminiResult,
              measure_datetime,
            },
          },
        },
      });
    } else {
      await prisma.measur.create({
        data: {
          measure_uuid,
          measure_type,
          image_url,
          has_confirmed: false,
          measure_value: geminiResult,
          measure_datetime,
          customerId: customer_code,
        },
      });
    }

    reply.send({
      image_url,
      measure_value: geminiResult,
      measure_uuid,
    });
  });
}
