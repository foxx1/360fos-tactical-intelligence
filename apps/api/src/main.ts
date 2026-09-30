import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
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
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();