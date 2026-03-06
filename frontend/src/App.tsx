import {
  Box,
  Button,
  CircularProgress,
  Container,
  CssBaseline,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { AuthForm } from "./components/AuthForm/AuthForm";
import { DatasetsPage } from "./pages/DatasetsPage";
import { DatasetDetailPage } from "./pages/DatasetDetailPage";
import { config } from "./config";
import { useDispatch, useSelector } from "./store/hooks";
import { fetchMe } from "./store/middlewares/authMiddleware";
import { clearAuth } from "./store/reducers/authReducer";
import { theme } from "./theme";
import "./App.css";

function AppContent() {
  const dispatch = useDispatch();
  const auth = useSelector((s) => s.auth);
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(config.authToken);
    if (token) {
      dispatch(fetchMe());
    }
  }, [dispatch]);

  const hasToken = typeof window !== "undefined" && !!localStorage.getItem(config.authToken);
  const checkingAuth = hasToken && !auth.isAuthenticated && auth.isLoading;

  const handleBack = useCallback(() => setSelectedDatasetId(null), []);

  if (checkingAuth) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!auth.isAuthenticated) {
    return <AuthForm />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Datasets</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {auth.user?.email}
          </Typography>
          <Button size="small" variant="outlined" onClick={() => dispatch(clearAuth())}>
            Log out
          </Button>
        </Box>
      </Box>
      {selectedDatasetId != null ? (
        <DatasetDetailPage datasetId={selectedDatasetId} onBack={handleBack} />
      ) : (
        <DatasetsPage onDatasetClick={setSelectedDatasetId} />
      )}
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
