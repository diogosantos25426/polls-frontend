import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./components/HomePage.jsx"; 
import PollList from "./components/PollList.jsx";
import PollView from "./components/PollView.jsx";
import CreatePollPage from "./components/CreatePollPage.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import Res from "./components/RespondPage.jsx";
import Navbar from "./components/Navbar.jsx";
import { AuthContext } from "./components/AuthContext";
import UserProfile from "./components/UserProfile.jsx";
import MeetingMode from "./components/MeetingMode.jsx";
import PollQRCode from "./components/PollQRCode.jsx";
import Lobby from "./components/Lobby.jsx";
import LiveStats from "./components/LiveStats.jsx";
import MeetingHost from "./components/MeetingHost.jsx";
import LivePollSimple from "./components/LivePoll.jsx";
import background from "./assets/background.png";
import EditPollPage from "./components/EditPollPage.jsx"; 
import "./App.css";

export default function App() {
  const { user } = useContext(AuthContext);

  return (
    <div
      className="App"
      style={{
        backgroundImage: `url(${background})`,
      }}
    >
      <div className="overlay" />

      <Navbar />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/polls" element={user ? <PollList /> : <Navigate to="/login" />} />
          <Route path="/poll/:id" element={<PollView />} />
          <Route path="/respond/:id" element={<Res />} />
          <Route path="/create-poll" element={user ? <CreatePollPage /> : <Navigate to="/login" />} />
          <Route path="/polls/edit/:id" element={user ? <EditPollPage /> : <Navigate to="/login" />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/polls" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/polls" />} />
          <Route path="/profile" element={user ? <UserProfile /> : <Navigate to="/login" />} />
          <Route path="/meeting-mode" element={user ? <MeetingMode /> : <Navigate to="/login" />} />
          <Route path="/lobby/:pollId" element={<Lobby />} />
          <Route path="/livepoll/:pollId" element={<LivePollSimple />} />
          <Route path="/livestats/:pollId" element={<LiveStats />} />
          <Route path="/meeting/:pollId/qr" element={<PollQRCode />} />
          <Route path="/meeting/:pollId/host" element={<MeetingHost />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
