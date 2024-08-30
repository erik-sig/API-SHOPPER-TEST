export interface CustomError extends Error {
  statusCode?: number;
  HTTP?: string;
}
