/** Generic Axios response wrapper. */
export default interface IApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

/** Application-level envelope every VijayDairy.Api MediatR handler returns. */
export interface IApiSuccessResponse<T> {
  error: boolean;
  statusCode: number;
  messageId: string;
  messageText: string;
  data: T;
}
