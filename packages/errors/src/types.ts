export interface CommonError {
  statusCode: number;
  type: string;
  message: string;
  error?: any;
}
