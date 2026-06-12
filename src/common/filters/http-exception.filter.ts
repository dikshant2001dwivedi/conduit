import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException
} from "@nestjs/common";
import { Response } from "express";

function toBodyErrors(payload: unknown): string[] {
  if (Array.isArray(payload)) {
    return payload.map(String);
  }

  if (payload && typeof payload === "object") {
    const asRecord = payload as Record<string, unknown>;

    if (
      asRecord.errors &&
      typeof asRecord.errors === "object" &&
      Array.isArray((asRecord.errors as Record<string, unknown>).body)
    ) {
      return ((asRecord.errors as Record<string, unknown>).body as unknown[]).map(
        String
      );
    }

    if (typeof asRecord.message === "string") {
      return [asRecord.message];
    }

    if (Array.isArray(asRecord.message)) {
      return (asRecord.message as unknown[]).map(String);
    }
  }

  return ["Bad Request"];
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    response.status(status).json({
      errors: {
        body: toBodyErrors(exceptionResponse)
      }
    });
  }
}