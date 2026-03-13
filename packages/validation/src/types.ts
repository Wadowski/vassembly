import { WrongParamError } from '@vassembly/errors';

export type ValidatorSuccessResult<T> = { success: true; data: T; error?: undefined };
export type ValidatorErrorResult = { success: false; error: WrongParamError; data?: undefined };
export type ValidatorResult<T> = ValidatorSuccessResult<T> | ValidatorErrorResult;
