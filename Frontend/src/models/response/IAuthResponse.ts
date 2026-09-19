export interface IUserVM {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default interface IAuthResponse {
  token: string;
  user: IUserVM;
}
