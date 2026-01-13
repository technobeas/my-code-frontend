import { BrowserRouter, Routes, Route } from "react-router-dom";
import Menu from "./pages/Menu";
import Kitchen from "./pages/Kitchen";
import Waiter from "./pages/Waiter";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/app/:tableNo" element={<Menu />} />
        <Route path="/kitchen" element={<Kitchen />} />
        <Route path="/waiter" element={<Waiter />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
