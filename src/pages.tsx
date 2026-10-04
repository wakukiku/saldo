import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  Search,
  Plus,
  SlidersHorizontal,
  Target,
  CreditCard,
  Pencil,
} from "lucide-react";
import {
  useStore,
  money,
  monthData,
  total,
  balanceAt,
  categories,
  accounts,
  type Transaction,
  type Goal,
  type Subscription,
} from "./store";
import { CategoryIcon, Progress, Empty } from "./ui";
export interface PageProps {
  month: string;
  add: () => void;
  detail: (t: Transaction) => void;
}
export function TransactionRow({
  transaction: t,
  onClick,
  compact = false,
}: {
  transaction: Transaction;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      className={`transaction-row ${compact ? "compact" : ""}`}
      onClick={onClick}
    >
      <CategoryIcon category={t.category} />
      <span className="merchant">
        <strong>{t.merchant}</strong>
        <small>{t.category}</small>
      </span>
      {!compact && (
        <>
          <span className="row-account">{t.account}</span>
          <span className="row-time">{t.date.slice(11)}</span>
        </>
      )}
      <span className="transaction-amount">
        <strong className={t.kind === "income" ? "positive" : ""}>
          {t.kind === "income" ? "+" : t.kind === "expense" ? "−" : "↔"}
          {money(t.amount)}
        </strong>
        <small>
          {new Date(t.date).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "short",
          })}
        </small>
      </span>
    </button>
  );
}
export function BalanceChart({ month }: { month: string }) {
  const transactions = useStore((s) => s.transactions);
  const [period, setPeriod] = useState("Месяц");
  const end = new Date(`${month}-01T12:00`);
  end.setMonth(end.getMonth() + 1, 0);
  const start = new Date(end);
  if (period === "Неделя") start.setDate(end.getDate() - 6);
  else if (period === "Месяц") start.setDate(1);
  else if (period === "Год") start.setMonth(0, 1);
  else start.setFullYear(2025, 0, 1);
  const data = [];
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    data.push({
      date,
      label: d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
      value: balanceAt(transactions, date),
    });
  }
  return (
    <section className="card chart-card">
      <div className="section-head">
        <h2>Баланс</h2>
        <div className="segments small">
          {["Неделя", "Месяц", "Год", "Всё время"].map((p) => (
            <button
              key={p}
              className={period === p ? "selected" : ""}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="balance-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#165E45" stopOpacity={0.17} />
                <stop offset="100%" stopColor="#165E45" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#edf0ee" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              minTickGap={45}
              tick={{ fontSize: 11, fill: "#64748b" }}
            />
            <YAxis
              width={58}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickFormatter={(n) => `${Math.round(n / 1000)}к`}
            />
            <Tooltip
              formatter={(v) => [money(Number(v)), "Баланс"]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#0F3D2E"
              isAnimationActive={false}
              strokeWidth={2.2}
              fill="url(#balance-fill)"
              activeDot={{ r: 5, stroke: "white", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
export function BudgetTiles({
  month,
  edit,
}: {
  month: string;
  edit?: (category: string) => void;
}) {
  const s = useStore();
  const tx = monthData(s.transactions, month);
  return (
    <div className={edit ? "budget-list" : "budget-tiles"}>
      {(edit
        ? categories
        : ["Продукты", "Рестораны", "Транспорт", "Развлечения"]
      ).map((c) => {
        const spent = total(
          tx.filter((t) => t.category === c),
          "expense",
        );
        const limit = s.budgets[c] || 0;
        const percent = limit ? (spent / limit) * 100 : 0;
        return (
          <div className="budget-tile" key={c}>
            <div className="budget-top">
              <CategoryIcon category={c} />
              <div>
                <strong>{c}</strong>
                <p>
                  <b>{money(spent)}</b>
                  <span> / {money(limit)}</span>
                </p>
              </div>
              {edit && (
                <button
                  className="icon-button"
                  aria-label={`Изменить бюджет: ${c}`}
                  onClick={() => edit(c)}
                >
                  <Pencil size={16} />
                </button>
              )}
            </div>
            <div className="progress-row">
              <Progress value={percent} />
              <small>{Math.round(percent)}%</small>
            </div>
            {percent > 100 && (
              <small className="danger">
                Превышен на {money(spent - limit)}
              </small>
            )}
          </div>
        );
      })}
    </div>
  );
}
export function Dashboard({ month, add, detail }: PageProps) {
  const s = useStore();
  const tx = monthData(s.transactions, month);
  const income = total(tx, "income"),
    expense = total(tx, "expense");
  const prev = new Date(month + "-01T12:00");
  prev.setMonth(prev.getMonth() - 1);
  const prevTx = monthData(
    s.transactions,
    `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`,
  );
  const change = (kind: "income" | "expense") => {
    const before = total(prevTx, kind);
    return before
      ? `${((total(tx, kind) / before - 1) * 100).toFixed(1).replace(".", ",")}%`
      : "Нет данных";
  };
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Добрый вечер, {s.name}</h1>
          <p>Ваши финансы — в одном месте.</p>
        </div>
        <button className="primary" onClick={add}>
          <Plus size={17} />
          Добавить операцию
        </button>
      </div>
      <div className="metrics">
        <section className="card balance-card">
          <div className="metric-label">
            Текущий баланс <ArrowRight size={15} />
          </div>
          <strong className="big-balance">
            {money(balanceAt(s.transactions, month + "-31"))}
          </strong>
          <span className="balance-note">
            {income - expense >= 0 ? "+" : ""}
            {money(income - expense)} за месяц
          </span>
          <svg className="watermark" viewBox="0 0 28 34">
            <path
              d="M2 8 12 2v25L2 33zM17 12l10 6v15H17z"
              fill="currentColor"
            />
          </svg>
        </section>
        {(["income", "expense"] as const).map((k) => (
          <section className="card metric" key={k}>
            <div className="metric-label">
              <span className={`mini-icon ${k}`}>
                {k === "income" ? (
                  <ArrowDownLeft size={16} />
                ) : (
                  <ArrowUpRight size={16} />
                )}
              </span>
              {k === "income" ? "Доходы" : "Расходы"}
            </div>
            <div className="metric-value">
              {money(k === "income" ? income : expense)}
              <span className="badge">{change(k)}</span>
            </div>
            <p>По сравнению с прошлым месяцем</p>
          </section>
        ))}
      </div>
      <div className="dashboard-grid">
        <BalanceChart month={month} />
        <section className="card recent">
          <div className="section-head">
            <h2>Последние операции</h2>
            <Link to="/transactions">
              Все операции <ArrowRight size={14} />
            </Link>
          </div>
          {tx.length ? (
            tx
              .slice(0, 5)
              .map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  compact
                  onClick={() => detail(t)}
                />
              ))
          ) : (
            <Empty />
          )}
        </section>
      </div>
      <section className="card">
        <div className="section-head">
          <h2>Бюджеты по категориям</h2>
          <Link to="/budgets">
            Все бюджеты <ArrowRight size={14} />
          </Link>
        </div>
        <BudgetTiles month={month} />
      </section>
      <div className="footnote">
        <span className="status-dot" />
        Изменения сохраняются на этом устройстве
      </div>
    </>
  );
}
export function Transactions({ month, add, detail }: PageProps) {
  const transactions = useStore((s) => s.transactions);
  const [query, setQuery] = useState(
    new URLSearchParams(location.search).get("q") || "",
  );
  const [kind, setKind] = useState("all");
  const [cat, setCat] = useState("");
  const [account, setAccount] = useState("");
  const [tag, setTag] = useState("");
  const tx = monthData(transactions, month);
  const filtered = tx.filter(
    (t) =>
      (kind === "all" || t.kind === kind) &&
      (!cat || t.category === cat) &&
      (!account || t.account === account) &&
      (!tag || t.tags === tag) &&
      `${t.merchant} ${t.category} ${t.comment} ${t.tags}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const dates = [...new Set(filtered.map((t) => t.date.slice(0, 10)))];
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Операции</h1>
          <p>Все движения денег. {tx.length} операций за месяц.</p>
        </div>
        <button className="primary" onClick={add}>
          <Plus size={17} />
          Добавить операцию
        </button>
      </div>
      <label className="search-field">
        <Search size={20} />
        <input
          aria-label="Поиск операций"
          placeholder="Поиск по операциям, магазинам, категориям…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <kbd>Поиск</kbd>
      </label>
      <div className="filters">
        <div className="segments">
          {[
            ["all", "Все"],
            ["expense", "Расходы"],
            ["income", "Доходы"],
            ["transfer", "Переводы"],
          ].map(([v, l]) => (
            <button
              key={v}
              className={kind === v ? "selected" : ""}
              onClick={() => setKind(v)}
            >
              {l}
            </button>
          ))}
        </div>
        <SlidersHorizontal size={17} className="filter-icon" />
        <select
          aria-label="Категория"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
        >
          <option value="">Все категории</option>
          {[...categories, "Доходы", "Перевод"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label="Фильтр счёта"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
        >
          <option value="">Все счета</option>
          {accounts.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <select
          aria-label="Метка"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        >
          <option value="">Все метки</option>
          {[...new Set(tx.map((t) => t.tags).filter(Boolean))].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      {!dates.length ? (
        <section className="card">
          <Empty
            text={tx.length ? "Ничего не найдено" : "Пока нет операций"}
            detail={
              tx.length
                ? "Попробуйте другой запрос или сбросьте фильтры."
                : "Добавьте первую операцию за этот месяц."
            }
          />
          <button
            className="secondary centered"
            onClick={() => {
              setQuery("");
              setKind("all");
              setCat("");
              setAccount("");
              setTag("");
            }}
          >
            Сбросить фильтры
          </button>
        </section>
      ) : (
        dates.map((d) => (
          <section className="card transaction-group" key={d}>
            <div className="date-heading">
              <h3>
                {new Date(d + "T12:00").toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  weekday: "long",
                })}
              </h3>
              <span>
                {money(
                  filtered
                    .filter((t) => t.date.startsWith(d))
                    .reduce(
                      (a, t) =>
                        a +
                        (t.kind === "income"
                          ? t.amount
                          : t.kind === "expense"
                            ? -t.amount
                            : 0),
                      0,
                    ),
                )}
              </span>
            </div>
            {filtered
              .filter((t) => t.date.startsWith(d))
              .map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  onClick={() => detail(t)}
                />
              ))}
          </section>
        ))
      )}
    </>
  );
}
const colors = [
  "#168361",
  "#ed8876",
  "#69adbf",
  "#ae91c9",
  "#8273b9",
  "#d58ba1",
  "#d6b361",
  "#a0aaa5",
];
export function Statistics({ month }: { month: string }) {
  const transactions = useStore((s) => s.transactions);
  const [tab, setTab] = useState("expense");
  const tx = monthData(transactions, month);
  const list = tab === "income" ? ["Зарплата", "Фриланс"] : categories;
  const data = list
    .map((name, i) => ({
      name,
      value: total(
        tx.filter((t) =>
          tab === "income" ? t.merchant === name : t.category === name,
        ),
        tab === "income" ? "income" : "expense",
      ),
      color: colors[i],
    }))
    .filter((x) => x.value > 0);
  const sum = data.reduce((a, x) => a + x.value, 0);
  const chartData = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(month + "-01T12:00");
    d.setMonth(d.getMonth() - 2 + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return {
      name: d.toLocaleDateString("ru-RU", { month: "short" }),
      value: total(
        monthData(transactions, key),
        tab === "income" ? "income" : "expense",
      ),
    };
  });
  const before = chartData[1].value;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Статистика</h1>
          <p>Полная картина ваших финансов.</p>
        </div>
      </div>
      <div className="segments stats-tabs">
        {[
          ["expense", "Расходы"],
          ["income", "Доходы"],
          ["balance", "Баланс"],
        ].map(([v, l]) => (
          <button
            className={tab === v ? "selected" : ""}
            key={v}
            onClick={() => setTab(v)}
          >
            {l}
          </button>
        ))}
      </div>
      {tab === "balance" ? (
        <BalanceChart month={month} />
      ) : (
        <>
          <div className="statistics-grid">
            <div className="summary-stack">
              <section className="card">
                <h2>Всего {tab === "income" ? "доходов" : "расходов"}</h2>
                <div className="summary-number">{money(sum)}</div>
                <p>За выбранный месяц</p>
              </section>
              <section className="card">
                <h3>Сравнение с прошлым месяцем</h3>
                <div className="comparison">
                  <div>
                    <small>Прошлый месяц</small>
                    <strong>{money(before)}</strong>
                  </div>
                  <div>
                    <small>Этот месяц</small>
                    <strong>{money(sum)}</strong>
                  </div>
                </div>
                <p>
                  {before
                    ? `${sum >= before ? "На" : "На"} ${money(Math.abs(sum - before))} ${sum >= before ? "больше" : "меньше"}`
                    : "Нет данных за предыдущий месяц"}
                </p>
              </section>
            </div>
            <section className="card">
              <h2>
                {tab === "income"
                  ? "Источники дохода"
                  : "Расходы по категориям"}
              </h2>
              {sum ? (
                <div className="donut-layout">
                  <div className="donut">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data}
                          dataKey="value"
                          innerRadius="72%"
                          outerRadius="94%"
                          paddingAngle={2}
                          stroke="none"
                        >
                          {data.map((x) => (
                            <Cell key={x.name} fill={x.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => money(Number(v))} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-label">
                      <strong>{money(sum)}</strong>
                      <small>За месяц</small>
                    </div>
                  </div>
                  <div className="legend">
                    {data.map((x) => (
                      <div key={x.name}>
                        <span
                          className="legend-dot"
                          style={{ background: x.color }}
                        />
                        <span>{x.name}</span>
                        <b>{money(x.value)}</b>
                        <small>{Math.round((x.value / sum) * 100)}%</small>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Empty
                  text="Недостаточно данных"
                  detail="Добавьте операции за выбранный месяц."
                />
              )}
            </section>
          </div>
          <section className="card">
            <h2>Динамика {tab === "income" ? "доходов" : "расходов"}</h2>
            <div className="bar-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={64}>
                  <CartesianGrid vertical={false} stroke="#edf0ee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(n) => `${n / 1000} тыс.`}
                    width={70}
                  />
                  <Tooltip
                    formatter={(v) => money(Number(v))}
                    cursor={{ fill: "#f7f8f7" }}
                  />
                  <Bar
                    dataKey="value"
                    name={tab === "income" ? "Доходы" : "Расходы"}
                    radius={[5, 5, 0, 0]}
                  >
                    {chartData.map((x, i) => (
                      <Cell
                        key={x.name}
                        fill={i === 2 ? "#0F3D2E" : "#d7e7de"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </>
  );
}
export function Budgets({
  month,
  edit,
}: {
  month: string;
  edit: (category: string) => void;
}) {
  const s = useStore();
  const spent = total(monthData(s.transactions, month), "expense");
  const limit = Object.values(s.budgets).reduce((a, b) => a + b, 0);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Бюджеты</h1>
          <p>Планируйте расходы и сохраняйте равновесие.</p>
        </div>
      </div>
      <section className="card budget-summary">
        <div>
          <small>Использовано за месяц</small>
          <div className="summary-number">
            {money(spent)} <span>из {money(limit)}</span>
          </div>
        </div>
        <div>
          <span>Осталось</span>
          <h2 className={spent > limit ? "danger" : "positive"}>
            {money(limit - spent)}
          </h2>
        </div>
        <Progress value={limit ? (spent / limit) * 100 : 0} />
      </section>
      <section className="card">
        <div className="section-head">
          <h2>Бюджеты по категориям</h2>
          <small>Нажмите на карандаш, чтобы изменить лимит</small>
        </div>
        <BudgetTiles month={month} edit={edit} />
      </section>
    </>
  );
}
export function Subscriptions({ edit }: { edit: (s?: Subscription) => void }) {
  const list = useStore((s) => s.subscriptions);
  const sum = list.reduce((a, s) => a + s.amount, 0);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Подписки</h1>
          <p>Регулярные платежи под контролем.</p>
        </div>
        <button className="primary" onClick={() => edit()}>
          <Plus size={17} />
          Добавить подписку
        </button>
      </div>
      <section className="card subscription-summary">
        <CreditCard size={28} />
        <div>
          <small>Ежемесячные платежи</small>
          <div className="summary-number">
            {money(sum)}
            <span> / месяц</span>
          </div>
        </div>
        <p>{money(sum * 12)} в год</p>
      </section>
      <div className="resource-grid">
        {list.map((s) => (
          <section className="card resource-card" key={s.id}>
            <div className="section-head">
              <span className="service-letter">{s.name[0]}</span>
              <button
                className="icon-button"
                aria-label={`Изменить ${s.name}`}
                onClick={() => edit(s)}
              >
                <Pencil size={17} />
              </button>
            </div>
            <h2>{s.name}</h2>
            <div className="resource-amount">
              {money(s.amount)} <small>/ месяц</small>
            </div>
            <div className="resource-footer">
              <span>Следующее списание</span>
              <strong>
                {new Date(s.date + "T12:00").toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </strong>
            </div>
          </section>
        ))}
      </div>
      {!list.length && (
        <section className="card">
          <Empty
            text="Подписок пока нет"
            detail="Добавьте регулярные платежи, чтобы видеть их общую сумму."
          />
        </section>
      )}
      <p className="footnote">
        Подписки — план платежей. Фактические списания добавляйте в операции.
      </p>
    </>
  );
}
export function Goals({ edit }: { edit: (g?: Goal) => void }) {
  const goals = useStore((s) => s.goals);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Цели</h1>
          <p>Большие планы начинаются с небольших шагов.</p>
        </div>
        <button className="primary" onClick={() => edit()}>
          <Plus size={17} />
          Новая цель
        </button>
      </div>
      <div className="resource-grid">
        {goals.map((g) => (
          <section className="card resource-card" key={g.id}>
            <div className="section-head">
              <span className="category-icon">
                <Target size={23} />
              </span>
              <button
                className="icon-button"
                aria-label={`Изменить ${g.name}`}
                onClick={() => edit(g)}
              >
                <Pencil size={17} />
              </button>
            </div>
            <h2>{g.name}</h2>
            <div className="resource-amount">
              {money(g.saved)} <small>/ {money(g.target)}</small>
            </div>
            <div className="goal-progress">
              <Progress value={(g.saved / g.target) * 100} />
              <small>{Math.round((g.saved / g.target) * 100)}%</small>
            </div>
            <p>
              {g.saved >= g.target
                ? "Цель достигнута!"
                : `Осталось накопить ${money(g.target - g.saved)}`}
            </p>
            <button className="secondary full" onClick={() => edit(g)}>
              Пополнить цель
            </button>
          </section>
        ))}
      </div>
      {!goals.length && (
        <section className="card">
          <Empty
            text="Какая у вас следующая цель?"
            detail="Создайте цель и отслеживайте накопления."
          />
        </section>
      )}
      <p className="footnote">
        Накопления в целях учитываются отдельно и не меняют баланс операций.
      </p>
    </>
  );
}
