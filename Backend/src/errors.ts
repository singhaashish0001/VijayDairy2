/** Same message ids / texts as the old .NET ErrorMessages + SuccessMessages enums. */
export const ErrorMessages = {
  Unauthorized: 'Unauthorized',
  RecordNotFound: 'Record Not Found',
  SomethingWentWrong: 'Something Went Wrong',
  InvalidEmailOrPassword: 'Invalid Email Or Password',
  NameNotAvailable: 'Name Not Available',
  InvalidRequest: 'Invalid Request',
  NoFieldsToUpdate: 'No Fields To Update',
  InvalidFile: 'Invalid File',
} as const;

export const SuccessMessages = {
  AddSuccess: 'Added successfully',
  UpdateSuccess: 'Updated successfully',
  DeleteSuccess: 'Deleted successfully',
  LogoutSuccess: 'Logged out',
} as const;

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly messageId: string,
    public readonly messageText: string,
  ) {
    super(messageId);
  }
}

const fromEnum = (status: number, key: keyof typeof ErrorMessages) => new AppError(status, key, ErrorMessages[key]);

export const notFound = () => fromEnum(404, 'RecordNotFound');
export const duplicateName = () => fromEnum(409, 'NameNotAvailable');
export const unauthorized = () => fromEnum(401, 'Unauthorized');
export const invalidLogin = () => fromEnum(401, 'InvalidEmailOrPassword');
/** 400 — the message doubles as messageId and messageText, like the .NET ValidationException. */
export const validation = (message: string) => new AppError(400, message, message);
