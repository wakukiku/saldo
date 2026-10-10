import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import {
  BrowserRouter,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  Search,
  Plus,
  House,
  ArrowLeftRight,
  ChartNoAxesColumn,
  Menu,
  Check,
  ArrowRight,
  X,
} from "lucide-react";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import { createRoot } from "react-dom/client";
const Dashboard = lazy(() =>
  import("./pages").then((m) => ({ default: m.Dashboard })),
);
const Transactions = lazy(() =>
  import("./pages").then((m) => ({ default: m.Transactions })),
);
const Statistics = lazy(() =>
  import("./pages").then((m) => ({ default: m.Statistics })),
);
const Budgets = lazy(() =>
  import("./pages").then((m) => ({ default: m.Budgets })),
);
const Subscriptions = lazy(() =>
  import("./pages").then((m) => ({ default: m.Subscriptions })),
);
const Goals = lazy(() => import("./pages").then((m) => ({ default: m.Goals })));
import { Editor, type Overlay } from "./editors";
import { Logo } from "./ui";
import { AuthorMark } from "./AuthorMark";
import { monthLabel, useStore, type Transaction } from "./store";
import "./styles.css";
const nav = [
  ["/", "Главная"],
  ["/transactions", "Операции"],
  ["/statistics", "Статистика"],
  ["/budgets", "Бюджеты"],
  ["/subscriptions", "Подписки"],
  ["/goals", "Цели"],
];
function App() {
  const [month, setMonth] = useState("2025-03");
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [toast, setToast] = useState("");
  const [more, setMore] = useState(false);
  const name = useStore((s) => s.name);
  const navigate = useNavigate();
  const location = useLocation();
  const close = useCallback(() => setOverlay(null), []);
  const add = () => setOverlay({ type: "transaction" });
  const detail = (transaction: Transaction) =>
    setOverlay({ type: "transaction", transaction, detail: true });
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    setMore(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <header>
        <div className="header-inner">
          <NavLink to="/" aria-label="SALDO — Главная">
            <Logo />
          </NavLink>
          <nav className="desktop-nav">
            {nav.map(([to, label]) => (
              <NavLink end={to === "/"} key={to} to={to}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className="icon-button global-search"
              aria-label="Поиск"
              onClick={() => {
                navigate("/transactions");
                setTimeout(
                  () =>
                    document
                      .querySelector<HTMLInputElement>(".search-field input")
                      ?.focus(),
                  100,
                );
              }}
            >
              <Search size={19} />
            </button>
            <label className="month-select">
              <span className="sr-only">Выберите месяц</span>
              <select value={month} onChange={(e) => setMonth(e.target.value)}>
                {Array.from({ length: 24 }, (_, i) => {
                  const year = 2025 + Math.floor(i / 12),
                    m = `${year}-${String((i % 12) + 1).padStart(2, "0")}`;
                  return (
                    <option value={m} key={m}>
                      {monthLabel(m)}
                    </option>
                  );
                })}
              </select>
            </label>
            <button
              className="avatar"
              aria-label="Профиль"
              onClick={() => setOverlay({ type: "profile" })}
            >
              {name[0]?.toUpperCase()}
            </button>
          </div>
        </div>
      </header>
      <main>
        <Suspense
          fallback={
            <div className="loading-state" role="status">
              Загружаем ваши финансы…
            </div>
          }
        >
          <Routes>
            <Route
              path="/"
              element={<Dashboard month={month} add={add} detail={detail} />}
            />
            <Route
              path="/transactions"
              element={<Transactions month={month} add={add} detail={detail} />}
            />
            <Route path="/statistics" element={<Statistics month={month} />} />
            <Route
              path="/budgets"
              element={
                <Budgets
                  month={month}
                  edit={(category) => setOverlay({ type: "budget", category })}
                />
              }
            />
            <Route
              path="/subscriptions"
              element={
                <Subscriptions
                  edit={(subscription) =>
                    setOverlay({ type: "subscription", subscription })
                  }
                />
              }
            />
            <Route
              path="/goals"
              element={
                <Goals edit={(goal) => setOverlay({ type: "goal", goal })} />
              }
            />
            <Route
              path="*"
              element={
                <div className="empty">
                  <h1>Страница не найдена</h1>
                  <NavLink to="/">На главную</NavLink>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </main>
      <nav className="bottom-nav">
        <NavLink to="/" end>
          <House size={21} />
          Главная
        </NavLink>
        <NavLink to="/transactions">
          <ArrowLeftRight size={21} />
          Операции
        </NavLink>
        <button
          className="mobile-add"
          aria-label="Добавить операцию"
          onClick={add}
        >
          <Plus size={25} />
        </button>
        <NavLink to="/statistics">
          <ChartNoAxesColumn size={21} />
          Статистика
        </NavLink>
        <button
          className={more ? "active" : ""}
          aria-expanded={more}
          onClick={() => setMore(!more)}
        >
          <Menu size={21} />
          Ещё
        </button>
      </nav>
      {more && (
        <div className="more-menu">
          <div className="section-head">
            <h2>Разделы</h2>
            <button
              className="icon-button"
              aria-label="Закрыть меню"
              onClick={() => setMore(false)}
            >
              <X size={18} />
            </button>
          </div>
          {nav.slice(3).map(([to, label]) => (
            <NavLink key={to} to={to}>
              {label}
              <ArrowRight size={16} />
            </NavLink>
          ))}
        </div>
      )}
      {overlay && (
        <Editor
          key={JSON.stringify(overlay)}
          overlay={overlay}
          month={month}
          close={close}
          notify={setToast}
        />
      )}
      <AuthorMark />
      <div className="toast-region" aria-live="polite">
        {toast && (
          <div className="toast">
            <Check size={18} />
            {toast}
          </div>
        )}
      </div>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
