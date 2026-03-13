import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoadingSpinner, OfflineBanner, InstallPrompt } from "./components/UI";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import TamizajesPage from "./pages/TamizajesPage";
import MonitorPage from "./pages/MonitorPage";
import MedsPage from "./pages/MedsPage";
import TCCPage from "./pages/TCCPage";
import ProfilePage from "./pages/ProfilePage";
import VacunacionPage from "./pages/VacunacionPage";
import DashboardPage from "./pages/DashboardPage";

function AppContent() {
  const { user, loading, isDoctor } = useAuth();
  const [activeTab, setActiveTab] = useState(isDoctor ? "dashboard" : "tamizajes");

  if (loading) return <LoadingSpinner text="Cargando PrevenApp..." />;
  if (!user) return <LoginPage />;

  const pages = isDoctor
    ? { dashboard: <DashboardPage /> }
    : {
        tamizajes: <TamizajesPage />,
        monitor: <MonitorPage />,
        meds: <MedsPage />,
        vacunas: <VacunacionPage />,
        tcc: <TCCPage />,
        perfil: <ProfilePage />,
      };

  const validTab = pages[activeTab] ? activeTab : (isDoctor ? "dashboard" : "tamizajes");

  return (
    <>
      <OfflineBanner />
      <Layout activeTab={validTab} onNavigate={setActiveTab}>
        {pages[validTab]}
      </Layout>
      <InstallPrompt />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
