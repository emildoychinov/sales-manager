import { axiosClient } from "../utils/axiosClient";

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

const authApiRequests = {       
  register: (data: RegisterPayload): Promise<any> => {
    return axiosClient.post("/api/auth/register", data);
  },

  login: (data: LoginPayload): Promise<any> => {
    const form = new URLSearchParams();
    form.append("username", data.username);
    form.append("password", data.password);

    return axiosClient.post("/api/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },

  me: (): Promise<any> => {
    return axiosClient.get("/api/auth/me");
  },
};

export default authApiRequests;

