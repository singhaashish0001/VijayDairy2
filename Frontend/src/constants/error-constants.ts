/**
 * @file error-constants.ts
 * @description Fallback/normalised error message strings shown to the user when the
 *              API doesn't provide a specific one, matching the shape of the
 *              ResponseModel.MessageText field returned by the .NET backend.
 */
export const errorMessage = {
  ErrorOccurred: 'Something went wrong. Please try again.',
  Unauthorized: 'Your session has expired. Please sign in again.',
  UnauthorizedAccess: 'You do not have permission to do that.',
};
