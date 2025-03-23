import React from "react";
import ImprovedFileUpload from "./components/FileUpload";

const App: React.FC = () => {
  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center",
      backgroundColor: "#f7fafc",
      padding: "20px"
    }}>
      <ImprovedFileUpload />
    </div>
  );
};

export default App;