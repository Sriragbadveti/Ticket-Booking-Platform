import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import CardTicket from './components/CardTicket';
import Ticketsdisplay from './components/Ticketsdisplay';

const App = () => {
  return (
    <Routes>
      {/* Home page: Only shown if the user is signed out */}
      <Route
        path="/"
        element={
          <>
            <SignedOut>
              <CardTicket />
            </SignedOut>
            <SignedIn>
              <Navigate to="/tickets" replace />
            </SignedIn>
          </>
        }
      />

      {/* Protected Tickets Route (Only accessible when logged in) */}
      <Route
        path="/tickets"
        element={
          <>
            <SignedIn>
              <Ticketsdisplay />
            </SignedIn>
            <SignedOut>
              <Navigate to="/" replace />
            </SignedOut>
          </>
        }
      />
    </Routes>
  );
};

export default App;
