import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoadingSpinner, OfflineBanner, InstallPrompt } from "./components/UI";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import ConsentPage from "./pages/ConsentPage";
import OnboardingPage from "./pages/OnboardingPage";
import TamizajesPage from "./pages/TamizajesPage";
import MonitorPage from "./pages/MonitorPage";
import MedsPage from "./pages/MedsPage";
import TCCPage from "./pages/TCCPage";
import ProfilePage from "./pages/ProfilePage";
import DashboardPage from "./pages/DashboardPage";

function AppContent() {
  const { user, patient, loading, isDoctor, reload, login } = useAuth();
  const [activeTab, setActiveTab] = useState("tamizajes");
  const [authView, setAuthView] = useState("login"); // login | register | forgot

  useEffect(() => {
    if (!loading && user) {
      setActiveTab(isDoctor ? "dashboard" : "tamizajes");
    }
  }, [loading, user, isDoctor]);

  if (loading) return <LoadingSpinner text="Cargando PrevenApp..." />;

  // ─── Not logged in ─────────────────────────────
  if (!user) {
    if (authView === "register") return <RegisterPage onBack={() => setAuthView("login")} onSuccess={() => reload()} />;
    if (authView === "forgot") return <ForgotPasswordPage onBack={() => setAuthView("login")} onSuccess={() => setAuthView("login")} />;
    return <LoginPage onRegister={() => setAuthView("register")} onForgot={() => setAuthView("forgot")} />;
  }

  // ─── Patient must change temporary password ────
  if (!isDoctor && user.mustChangePassword) {
    return <ChangePasswordPage forced onSuccess={() => reload()} />;
  }

  // ─── Patient consent screen (Ley 81) ───────────
  if (!isDoctor && patient && !patient.consentSigned) {
    return <ConsentPage onAccept={() => reload()} />;
  }

  // ─── Patient onboarding (first-time setup) ─────
  if (!isDoctor && patient && !patient.onboardingCompleted) {
    return <OnboardingPage patient={patient} onComplete={() => reload()} />;
  }

  // ─── Main app ──────────────────────────────────
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
