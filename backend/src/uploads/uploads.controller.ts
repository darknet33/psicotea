import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { MulterExceptionFilter } from './multer-exception.filter';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  buildUniqueFilename,
  buildUploadPath,
  getUploadsDir,
} from './uploads.constants';

const WRITE_ROLES = [Role.ADMIN, Role.PERSONAL_ADMINISTRATIVO];

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseFilters(MulterExceptionFilter)
export class UploadsController {
  @Post('image')
  @Roles(...WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          try {
            cb(null, getUploadsDir());
          } catch (error) {
            cb(error as Error, '');
          }
        },
        filename: (_req, file, cb) => {
          cb(null, buildUniqueFilename(file.originalname, file.mimetype));
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE, files: 1 },
      fileFilter: (_req, file, cb) => {
        if ((ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
          cb(null, true);
          return;
        }

        cb(
          new BadRequestException(
            'Tipo de archivo no permitido. Solo se aceptan imágenes JPG, PNG o WEBP',
          ),
          false,
        );
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    return {
      url: buildUploadPath(file.filename),
      filename: file.filename,
    };
  }
}
