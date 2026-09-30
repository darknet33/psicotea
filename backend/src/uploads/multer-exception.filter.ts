import {
  HttpStatus,
  Catch,
  ExceptionFilter,
  ArgumentsHost,
} from '@nestjs/common';
import { MulterError } from 'multer';

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse();

    if (exception.code === 'LIMIT_FILE_SIZE') {
      response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        message: 'La imagen supera el tamaño máximo permitido (5 MB)',
        error: 'Payload Too Large',
      });
      return;
    }

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: `No se pudo procesar la imagen: ${exception.message}`,
      error: 'Bad Request',
    });
  }
}
