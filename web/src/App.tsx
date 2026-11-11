import { Route, Routes } from "react-router";
import { PageBackground } from "./art/PageBackground";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { CardRoute } from "./pages/CardRoute";
import { CardsHome } from "./pages/CardsHome";
import { OverviewPage } from "./pages/OverviewPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TransactionsPage } from "./pages/TransactionsPage";

export default function App() {
  return (
    <>
    <PageBackground />
    <Routes>
      <Route path="/" element={<OverviewPage />} />
      <Route path="/cards" element={<CardsHome />} />
      <Route path="/cards/:id" element={<CardRoute />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/payments" element={<PaymentsPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
    </>
  );
}
