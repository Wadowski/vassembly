import { describe, it, expect } from 'vitest';
import { CommonError } from './Error';
import { ErrorTypes, ErrorStatusCodes } from './errorTypes';
import {
  WrongParamError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  InternalError,
  TimeoutError,
} from './index';

describe('Error Classes', () => {
  describe('ValidationError', () => {
    it('should create an error with VALIDATION type and 422 status code', () => {
      const error = new ValidationError('Validation failed');

      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(CommonError);
      expect(error.type).toBe(ErrorTypes.VALIDATION);
      expect(error.statusCode).toBe(422);
      expect(error.message).toBe('Validation failed');
    });
  });

  describe('WrongParamError', () => {
    it('should create an error with WRONG_PARAM type and 400 status code', () => {
      const error = new WrongParamError('Invalid parameter');

      expect(error).toBeInstanceOf(WrongParamError);
      expect(error).toBeInstanceOf(CommonError);
      expect(error.type).toBe(ErrorTypes.WRONG_PARAM);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid parameter');
    });

    it('should include additional error context', () => {
      const originalError = new Error('Original error');
      const error = new WrongParamError('Invalid parameter', originalError);

      expect(error.error).toBe(originalError);
    });
  });

  describe('NotFoundError', () => {
    it('should create an error with NOT_FOUND type and 404 status code', () => {
      const error = new NotFoundError('Resource not found');

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error).toBeInstanceOf(CommonError);
      expect(error.type).toBe(ErrorTypes.NOT_FOUND);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create an error with UNAUTHORIZED type and 401 status code', () => {
      const error = new UnauthorizedError('Authentication required');

      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error).toBeInstanceOf(CommonError);
      expect(error.type).toBe(ErrorTypes.UNAUTHORIZED);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Authentication required');
    });
  });

  describe('ForbiddenError', () => {
    it('should create an error with FORBIDDEN type and 403 status code', () => {
      const error = new ForbiddenError('Access denied');

      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error).toBeInstanceOf(CommonError);
      expect(error.type).toBe(ErrorTypes.FORBIDDEN);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Access denied');
    });
  });

  describe('InternalError', () => {
    it('should create an error with INTERNAL_ERROR type and 500 status code', () => {
      const error = new InternalError('Something went wrong');

      expect(error).toBeInstanceOf(InternalError);
      expect(error).toBeInstanceOf(CommonError);
      expect(error.type).toBe(ErrorTypes.INTERNAL_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Something went wrong');
    });
  });

  describe('TimeoutError', () => {
    it('should create an error with TIMEOUT type and 408 status code', () => {
      const error = new TimeoutError('Request timeout');

      expect(error).toBeInstanceOf(TimeoutError);
      expect(error).toBeInstanceOf(CommonError);
      expect(error.type).toBe(ErrorTypes.TIMEOUT);
      expect(error.statusCode).toBe(408);
      expect(error.message).toBe('Request timeout');
    });
  });

  describe('ErrorStatusCodes', () => {
    it('should have correct status codes for all error types', () => {
      expect(ErrorStatusCodes[ErrorTypes.WRONG_PARAM]).toBe(400);
      expect(ErrorStatusCodes[ErrorTypes.VALIDATION]).toBe(422);
      expect(ErrorStatusCodes[ErrorTypes.NOT_FOUND]).toBe(404);
      expect(ErrorStatusCodes[ErrorTypes.UNAUTHORIZED]).toBe(401);
      expect(ErrorStatusCodes[ErrorTypes.FORBIDDEN]).toBe(403);
      expect(ErrorStatusCodes[ErrorTypes.INTERNAL_ERROR]).toBe(500);
      expect(ErrorStatusCodes[ErrorTypes.TIMEOUT]).toBe(408);
    });
  });

  describe('CommonError', () => {
    it('should create a base error with custom properties', () => {
      const error = new CommonError(418, ErrorTypes.WRONG_PARAM, 'Custom error message');

      expect(error.statusCode).toBe(418);
      expect(error.type).toBe(ErrorTypes.WRONG_PARAM);
      expect(error.message).toBe('Custom error message');
      expect(error).toBeInstanceOf(Error);
    });

    it('should properly extend Error class', () => {
      const error = new CommonError(400, ErrorTypes.WRONG_PARAM, 'Test error');

      expect(error instanceof Error).toBe(true);
      expect(error.name).toBe('Error');
    });
  });
});
