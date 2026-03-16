import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoadingSpinner, OfflineBanner, InstallPrompt } from "./components/UI";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import ConsentPage from "./pages/ConsentPage";
import TamizajesPage from "./pages/TamizajesPage";
import MonitorPage from "./pages/MonitorPage";
import MedsPage from "./pages/MedsPage";
import TCCPage from "./pages/TCCPage";
import ProfilePage from "./pages/ProfilePage";
import DashboardPage from "./pages/DashboardPage";

function AppContent() {
  const { user, patient, loading, isDoctor, reload } = useAuth();
  const [activeTab, setActiveTab] = useState("tamizajes");

  useEffect(() => {
    if (!loading && user) {
      setActiveTab(isDoctor ? "dashboard" : "tamizajes");
    }
  }, [loading, user, isDoctor]);

  if (loading) return <LoadingSpinner text="Cargando PrevenApp..." />;
  if (!user) return <LoginPage />;

  // Show consent screen for patients who haven't accepted
  if (!isDoctor && patient && !patient.consentSigned) {
    return <ConsentPage onAccept={() => reload()} />;
  }

  const pages = isDoctor
    ? { dashboard: <DashboardPage /> }
    : {
        tamizajes: <TamizajesPage />,
        monitor: <MonitorPage />,
        meds: <MedsPage />,
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
