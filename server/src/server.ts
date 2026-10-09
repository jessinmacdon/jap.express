import { buildApp } from './app.ts';
import { env } from './env.ts';

const app = await buildApp();
if (env.OTP_DEV_CODE) app.log.warn('OTP_DEV_CODE is set: every phone number accepts the fixed demo code. Unset it before real users sign up.');
await app.listen({ port: env.PORT, host: env.HOST });
