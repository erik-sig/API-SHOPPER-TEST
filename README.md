### OBS: COMO FIZ O BANCO DE DADOS COM PRISMA, COLOQUEI UMA DATABASE_URL NO .env.example QUE IRÁ FUNCIONAR

### REGRAS DA APLICAÇÃO ATENDIDAS

CRIAR 3 ENDPOINTS -> POST, PATCH, GET

#### POST

Responsável por receber uma imagem em base 64, consultar o Gemini e retornar a
medida lida pela API

- [X] Validar o tipo de dados dos parâmetros enviados (inclusive o base64)
- [X] Verificar se já existe uma leitura no mês naquele tipo de leitura.
- [X] Integrar com uma API de LLM para extrair o valor da imagem

#### PATCH

Responsável por confirmar ou corrigir o valor lido pelo LLM

- [X] Validar o tipo de dados dos parâmetros enviados
- [X] Verificar se o código de leitura informado existe
- [X] Verificar se o código de leitura já foi confirmado
- [X] Salvar no banco de dados o novo valor informado

#### GET

Responsável por listar as medidas realizadas por um determinado cliente

-  [X] Receber o código do cliente e filtrar as medidas realizadas por ele
-  [X] Ele opcionalmente pode receber um query parameter “measure_type”, que
      deve ser “WATER” ou “GAS”

  - [X] A validação deve ser CASE INSENSITIVE

  - [X] Se o parâmetro for informado, filtrar apenas os valores do tipo
        especificado. Senão, retornar todos os tipos.
