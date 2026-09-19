import { SuccessMessages } from './errors';

export interface Envelope<T = undefined> {
  error: boolean;
  statusCode: number;
  messageId: string;
  messageText: string;
  data?: T;
}

/** Success envelope. `statusCode` inside the body is 201 for creates while the HTTP status stays 200 (as before). */
export const ok = <T>(data: T, statusCode = 200): Envelope<T> => ({
  error: false,
  statusCode,
  messageId: '',
  messageText: '',
  data,
});

export const deletedEnvelope = (): Envelope => ({
  error: false,
  statusCode: 200,
  messageId: 'DeleteSuccess',
  messageText: SuccessMessages.DeleteSuccess,
});
