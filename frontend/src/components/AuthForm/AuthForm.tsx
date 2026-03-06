import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import { isAxiosError } from "axios";
import { useState } from "react";
import { useDispatch, useSelector } from "../../store/hooks";
import { login, register } from "../../store/middlewares";
import { clearAuthError } from "../../store/reducers/authReducer";

type AuthMode = "login" | "register";

export function AuthForm() {
  const dispatch = useDispatch();
  const { errorMessage, isLoading } = useSelector((s) => s.auth);
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isLogin = mode === "login";

  const handleSubmit = async (e: { preventDefault(): void; currentTarget: HTMLFormElement }) => {
    e.preventDefault();
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) return;

    if (isLogin) {
      await dispatch(login({ username: trimmedEmail, password }));
    } else {
      const result = await dispatch(register({ email: trimmedEmail, password }));
      const payload = result.payload;

      if (payload && !isAxiosError(payload)) {
        dispatch(clearAuthError());
        setMode("login");
        setSuccessMessage("Registration successful. You can log in now.");
      }

    }
  };

  const switchMode = () => {
    dispatch(clearAuthError());
    setSuccessMessage(null);
    setEmail("");
    setPassword("");
    setMode(isLogin ? "register" : "login");
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 360,
        }}
      >
        <Typography
          component="h1"
          variant="h6"
          sx={{
            fontWeight: 600,
            color: "text.primary",
            mb: 3,
          }}
        >
          {isLogin ? "Sign in" : "Sign up"}
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            name="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete={isLogin ? "email" : "email"}
            autoFocus={!isLogin}
            size="small"
            disabled={isLoading}
            sx={{ "& .MuiInputBase-root": { bgcolor: "grey.50" } }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="password"
            name="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? "current-password" : "new-password"}
            size="small"
            disabled={isLoading}
            sx={{ "& .MuiInputBase-root": { bgcolor: "grey.50" } }}
          />

          <Box sx={{ minHeight: 48, mt: 2 }}>
            {successMessage && (
              <Alert severity="success" sx={{ py: 0.5 }}>
                {successMessage}
              </Alert>
            )}
            {errorMessage && (
              <Alert severity="error" sx={{ py: 0.5 }}>
                {errorMessage}
              </Alert>
            )}
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading}
            sx={{ mt: 1, py: 1.25, textTransform: "none", fontWeight: 600 }}
          >
            {isLoading ? (
              <CircularProgress size={22} color="inherit" />
            ) : isLogin ? (
              "Sign in"
            ) : (
              "Sign up"
            )}
          </Button>

          <Typography variant="body2" sx={{ mt: 2.5, color: "text.secondary" }}>
            {isLogin ? (
              <>
                Don&apos;t have an account?{" "}
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={switchMode}
                  sx={{ cursor: "pointer", fontWeight: 500 }}
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={switchMode}
                  sx={{ cursor: "pointer", fontWeight: 500 }}
                >
                  Sign in
                </Link>
              </>
            )}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
