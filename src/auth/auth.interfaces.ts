export interface IAuthPayload {
  id: string;
  email: string;
}

export interface RegisterReqBody {
  name: string;
  lastName: string;
  email: string;
  password: string;
}

export interface RegisterResBody {
  id: string;
  name: string;
  lastName: string;
  email: string;
}

export interface LoginReqBody {
  email: string;
  password: string;
}

export interface LoginResBody {
  accessToken: string;
}
