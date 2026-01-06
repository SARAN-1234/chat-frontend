import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import ChatPage from "./chat/ChatPage";
import ProfileSetup from "./profile/ProfileSetup";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import ProfileGuard from "./routes/ProfileGuard";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Profile Setup (JWT required, no ProfileGuard) */}
          <Route
            path="/profile-setup"
            element={
              <ProtectedRoute>
                <ProfileSetup />
              </ProtectedRoute>
            }
          />

          {/* Chat (JWT + ProfileGuard) */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ProfileGuard>
                  <ChatPage />
                </ProfileGuard>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
