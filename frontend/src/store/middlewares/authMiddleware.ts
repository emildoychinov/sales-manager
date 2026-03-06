import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AxiosError } from "axios";
import authApiRequests from "../../services/authApiRequests";
import type { LoginPayload, RegisterPayload } from "../../types";
import { config } from "../../config";

export const register = createAsyncThunk(
  "auth/register",
  async (data: RegisterPayload): Promise<unknown | AxiosError> => {
    try {
      const response = await authApiRequests.register(data);
      return response.data;
    } catch (err) {
      return err as AxiosError;
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (data: LoginPayload): Promise<unknown | AxiosError> => {
    try {
      const response = await authApiRequests.login(data);
      const token = response.data?.access_token;
      if (token && typeof token === "string") {
        localStorage.setItem(config.authToken, token);
      }
      const meResponse = await authApiRequests.me();
      return {
        user: meResponse.data,
        accessToken: token,
      };
    } catch (err) {
      return err as AxiosError;
    }
  }
);

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (): Promise<unknown | AxiosError> => {
    try {
      const response = await authApiRequests.me();
      return response.data;
    } catch (err) {
      return err as AxiosError;
    }
  }
);
