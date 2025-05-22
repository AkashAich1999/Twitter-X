import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/auth/login/LoginPage.jsx";
import SignUpPage from "./pages/auth/signup/SignUpPage.jsx";
import HomePage from "./pages/home/HomePage.jsx";
import NotificationPage from "./pages/notification/NotificationPage.jsx";
import ProfilePage from "./pages/profile/ProfilePage.jsx";

import Sidebar from "./components/common/Sidebar.jsx";
import RightPanel from "./components/common/RightPanel.jsx";
import { Toaster } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "./components/common/LoadingSpinner.jsx";

function App() {
  const { data:authUser, isLoading } = useQuery({
    // we use queryKey to give a unique name to our query and refer to it later
    queryKey: ['authUser'],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if(data.error){
          // if user is unauthorized
          return null;
        }
        if(!res.ok) throw new Error(data.error || "Something Went Wrong.");
        console.log("authUser is here: ", data);
        return data;

      } catch (error) {
        throw new Error(error);
      }
    },
    retry: false,
  });

  if(isLoading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  console.log(authUser);

  return (
    <div className="flex max-w-6xl mx-auto">
      {/* Common component, bc it's not wrapped with Routes */}
      <Sidebar />
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to={"/login"} /> } />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to={"/"} /> } />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to={"/"} /> } />
        <Route path="/notifications" element={authUser ? <NotificationPage /> : <Navigate to={"/login"} />} />
        <Route path="/profile/:username" element={authUser ? <ProfilePage /> : <Navigate to={"/login"} /> } />
      </Routes>
      <RightPanel />
      <Toaster />
    </div>
  )
}

export default App;
