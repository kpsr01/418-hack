// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from "./components/Navbar";
import Landing from "./components/Landing";
import Scanner from "./components/Scanner";
import SnackResult from "./components/SnackResult";
import Rewards from './components/Rewards';
import Contact from './components/Contact';

function App() {
  return (
    <Router>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={
            <>
              <Landing />
              <SnackResult />
            </>
          } />
          <Route path="/home" element={<>
              <Landing />
              <SnackResult />
            </>} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
