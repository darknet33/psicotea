import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { networkInterfaces } from 'os';
import { AppModule } from './app.module';
import { getUploadsDir } from './uploads/uploads.constants';

function getNetworkAddress(): string {
  const nets = networkInterfaces();
  // Las interfaces de Docker (docker0, br-*) también son IPv4 no internas y
  // salen antes que la wifi al enumerarlas, así que se descartan: sus IPs no
  // son alcanzables desde un móvil.
  const candidates: string[] = [];
  for (const name of Object.keys(nets)) {
    if (/^(docker|br-|veth|virbr)/.test(name)) continue;
    for (const net of nets[name] ?? []) {
      if (net.family !== 'IPv4' || net.internal) continue;
      candidates.push(net.address);
      if (/^(wl|wlan|en|eth)/.test(name)) return net.address;
    }
  }
  return candidates[0] ?? '0.0.0.0';
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const uploadsDir = getUploadsDir();
  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });

  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:3000')
    .split(',')
    .map((url: string) => url.trim());

  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*')
      ) {
        callback(null, true);
      } else {
        callback(null, origin);
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3001);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
  console.log(`Backend corriendo en http://localhost:${port}`);
  console.log(`Backend en red: http://${getNetworkAddress()}:${port}`);
}
void bootstrap();
