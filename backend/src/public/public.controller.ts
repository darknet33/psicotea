import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { PublicChildProfileDto } from './dto/public-child-profile.dto';
import { PublicService } from './public.service';

/**
 * Límite más estricto que el default global (100 / 15 min) porque este
 * endpoint es público y el token se podría intentar adivinar por fuerza bruta.
 */
const PUBLIC_THROTTLE = { limit: 30, ttl: 5 * 60 * 1000 };

/**
 * Endpoints públicos de consulta para los padres.
 *
 * IMPORTANTE: este controlador NO aplica `JwtAuthGuard`. Es la única superficie
 * sin autenticación del sistema. Todo lo que devuelva debe salir del DTO de
 * lista blanca `PublicChildProfileDto`.
 */
@Controller('public')
@UseGuards(ThrottlerGuard)
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('children/credential/:code')
  @Throttle({ default: PUBLIC_THROTTLE })
  async getChildByCredential(
    @Param('code') code: string,
  ): Promise<PublicChildProfileDto> {
    if (!code) {
      throw new NotFoundException('Credencial no válida.');
    }

    return this.publicService.getChildByCredential(code);
  }
}
