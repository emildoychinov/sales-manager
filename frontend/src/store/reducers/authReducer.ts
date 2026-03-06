import { createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { login, register, fetchMe } from "../middlewares/authMiddleware";
import { config } from "../../config";

export interface AuthUser {
  id: number;
  email: string;
  created_at: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  errorMessage: string;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  errorMessage: "",
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuth: (state) => {
      state.user = initialState.user;
      state.isLoading = initialState.isLoading;
      state.errorMessage = initialState.errorMessage;
      state.isAuthenticated = initialState.isAuthenticated;
      localStorage.removeItem(config.authToken);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = "";
      })
      .addCase(login.fulfilled, (state, action) => {
        if (isAxiosError(action.payload)) {
          state.errorMessage =
            action.payload.response?.status?.toString().startsWith("4")
              ? "Invalid credentials"
              : "Server error";
        } else {
          const payload = action.payload as { user: AuthUser; accessToken?: string };
          state.user = payload.user;
          state.isAuthenticated = true;
          state.errorMessage = "";
        }
        state.isLoading = false;
      })
      .addCase(login.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.errorMessage = "";
      })
      .addCase(register.fulfilled, (state, action) => {
        if (isAxiosError(action.payload)) {
          state.errorMessage =
            action.payload.response?.status === 400
              ? "Email already registered"
              : "Registration failed";
        } else {
          state.errorMessage = "";
        }
        state.isLoading = false;
      })
      .addCase(register.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchMe.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        if (isAxiosError(action.payload)) {
          state.user = null;
          state.isAuthenticated = false;
        } else {
          state.user = action.payload as AuthUser;
          state.isAuthenticated = true;
        }
        state.isLoading = false;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.isLoading = false;
      })
      .addMatcher(
        (action) =>
          typeof action.payload === "object" &&
          action.payload !== null &&
          "response" in action.payload &&
          (action.payload as { response?: { status?: number } }).response?.status === 401,
        (state) => {
          state.isAuthenticated = false;
          state.user = null;
          localStorage.removeItem(config.authToken);
        }
      );
  },
});

export const { clearAuth } = authSlice.actions;
export default authSlice.reducer;
