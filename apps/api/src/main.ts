import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api/v1");

  const corsOrigin = process.env.CORS_ORIGIN?.trim();
  app.enableCors(
    corsOrigin
      ? { origin: corsOrigin.split(",").map((origin) => origin.trim()).filter(Boolean), credentials: true }
      : undefined
  );

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();