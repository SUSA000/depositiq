import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import { useAuth } from "./context/AuthContext";

const AuthPage = lazy(() => import("./pages/AuthPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const InsightsPage = lazy(() => import("./pages/InsightsPage"));
const PredictPage = lazy(() => import("./pages/PredictPage"));
const PredictionResultPage = lazy(() => import("./pages/PredictionResultPage"));


function ProtectedRoute() {
  const { authenticated, loading } = useAuth();
  if (loading) return <div className="app-loader"><span className="spinner" /><p>Securing your workspace...</p></div>;
  return authenticated ? <AppShell /> : <Navigate to="/login" replace />;
}

function PublicOnlyRoute() {
  const { authenticated, loading } = useAuth();
  if (loading) return <div className="app-loader"><span className="spinner" /></div>;
  return authenticated ? <Navigate to="/" replace /> : <AuthPage />;
}

export default function App() {
  return (
    <Suspense fallback={<div className="app-loader"><span className="spinner" /><p>Loading workspace...</p></div>}>
      <Routes>
        <Route path="/login" element={<PublicOnlyRoute />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/predict" element={<PredictPage />} />
          <Route path="/predict/result" element={<PredictionResultPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
