import { randomInt } from 'node:crypto';

export const bookingReference = () => `JX-${randomInt(10000, 99999)}`;
