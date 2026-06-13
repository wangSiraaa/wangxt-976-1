import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Home from "@/pages/Home";
import { useAppStore } from "@/store/appStore";

export default function App() {
  const processExpiredOrders = useAppStore((s) => s.processExpiredOrders);

  useEffect(() => {
    processExpiredOrders();
    const timer = setInterval(() => {
      processExpiredOrders();
    }, 30000);

    return () => clearInterval(timer);
  }, [processExpiredOrders]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
      </Routes>
    </Router>
  );
}
