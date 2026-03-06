import {
  Box,
  Button,
  CircularProgress,
  Container,
  CssBaseline,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { useEffect } from "react";
import { AuthForm } from "./components/AuthForm/AuthForm";
import { config } from "./config";
import { useDispatch, useSelector } from "./store/hooks";
import { fetchMe } from "./store/middlewares/authMiddleware";
import { clearAuth } from "./store/reducers/authReducer";
import { theme } from "./theme";
import "./App.css";

function AppContent() {
  const dispatch = useDispatch();
  const auth = useSelector((s) => s.auth);

  useEffect(() => {
    const token = localStorage.getItem(config.authToken);
    if (token) {
      dispatch(fetchMe());
    }
  }, [dispatch]);

  const hasToken = typeof window !== "undefined" && !!localStorage.getItem(config.authToken);
  const checkingAuth = hasToken && !auth.isAuthenticated && auth.isLoading;

  if (checkingAuth) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
        <AuthForm />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">Logged in as {auth.user?.email}</Typography>
        <Button variant="outlined" color="primary" onClick={() => dispatch(clearAuth())}>
          Log out
        </Button>
      </Box>
    </Container>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContent />
    </ThemeProvider>
  );
}
