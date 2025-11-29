import React from "react";
import ReactDOM from "react-dom/client";
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import SpaceInvadersGame from "./SpaceInvadersGame.tsx";
import "./index.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import '@aws-amplify/ui-react/styles.css';


Amplify.configure(outputs);

function AuthWrapper() {
  const { user, signOut } = useAuthenticator();
  return <SpaceInvadersGame username={user?.signInDetails?.loginId || user?.username} signOut={signOut} />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Authenticator>
      <AuthWrapper />
    </Authenticator>
  </React.StrictMode>
);