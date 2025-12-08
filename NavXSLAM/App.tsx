import React from "react";
import { ViroARSceneNavigator } from "@viro-community/react-viro";
import SLAMScene from "./js/SLAMScene";

const App: React.FC = () => {
  return (
    <ViroARSceneNavigator
      autofocus
      initialScene={{
        scene: () => <SLAMScene />,
      }}
    />
  );
};

export default App;
