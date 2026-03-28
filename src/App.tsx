import { HashRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { ToastProvider } from "./components/ui/toast";
import { AccountsPage } from "./pages/AccountsPage";
import { BillsPage } from "./pages/BillsPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { ClosuresPage } from "./pages/ClosuresPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GoalsPage } from "./pages/GoalsPage";
import { SubscriptionsPage } from "./pages/SubscriptionsPage";
import { TransactionsPage } from "./pages/TransactionsPage";

export function App() {
  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="accounts" element={<AccountsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="closures" element={<ClosuresPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="bills" element={<BillsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
}
