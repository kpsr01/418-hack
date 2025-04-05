// src/App.jsx
import Navbar from "./components/Navbar";
import Landing from "./components/Landing";
import Scanner from "./components/Scanner";
import SnackResult from "./components/SnackResult";

function App() {
  return (
    <div>
      <Navbar />
      <Landing />
      <SnackResult />
    </div>
  );
}

export default App;
