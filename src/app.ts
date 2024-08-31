import fastify from 'fastify';
import path from 'path';
import { errorHandler } from './errors';
import serviceRoutes from './routes';

export const app = fastify();

app.register(serviceRoutes);
app.register(require('@fastify/static'), {
  root: path.join(__dirname, '../public/'),
  prefix: '/files/public/',
});
app.setErrorHandler(errorHandler);
