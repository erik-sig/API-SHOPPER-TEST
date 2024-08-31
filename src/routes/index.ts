import { FastifyInstance } from 'fastify';
import { confirm } from '../controllers/confirm.controller';
import { getList } from '../controllers/getList.controller';
import { upload } from '../controllers/upload.controller';

export default async function serviceRoutes(app: FastifyInstance) {
  app.get('/:customer_code/list', getList);
  app.patch('/confirm', confirm);
  app.post('/upload', upload);
}
