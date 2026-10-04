import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { X, Pencil, Trash2 } from "lucide-react";
import {
  accounts,
  categories,
  money,
  uid,
  useStore,
  type Transaction,
  type Kind,
  type Goal,
  type Subscription,
} from "./store";
import { CategoryIcon } from "./ui";
export type Overlay =
  | { type: "transaction"; transaction?: Transaction; detail?: boolean }
  | { type: "budget"; category: string }
  | { type: "subscription"; subscription?: Subscription }
  | { type: "goal"; goal?: Goal }
  | { type: "profile" };
export function Drawer({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input, select, textarea, [tabindex="0"]',
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [close]);
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="drawer"
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="drawer-head">
          <h2>{title}</h2>
          <button className="icon-button" aria-label="Закрыть" onClick={close}>
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function Editor({
  overlay,
  month,
  close,
  notify,
}: {
  overlay: Overlay;
  month: string;
  close: () => void;
  notify: (text: string) => void;
}) {
  const s = useStore();
  const [editing, setEditing] = useState(
    overlay.type !== "transaction" || !overlay.detail,
  );
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const tx = overlay.type === "transaction" ? overlay.transaction : undefined;
  const [kind, setKind] = useState<Kind>(tx?.kind || "expense");
  const [category, setCategory] = useState(tx?.category || categories[0]);
  const [account, setAccount] = useState(tx?.account || accounts[0]);
  const [destination, setDestination] = useState(
    tx?.destination || accounts[1],
  );
  const finish = (text: string) => {
    notify(text);
    close();
  };
  const remove = () => {
    if (overlay.type === "transaction" && tx) s.deleteTransaction(tx.id);
    if (overlay.type === "goal" && overlay.goal) s.deleteGoal(overlay.goal.id);
    if (overlay.type === "subscription" && overlay.subscription)
      s.deleteSubscription(overlay.subscription.id);
    finish("Удалено");
  };
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const str = (k: string) => String(f.get(k) || "").trim();
    const num = (k: string) => Number(str(k));
    if (
      (overlay.type === "transaction" && !str("merchant")) ||
      (["goal", "subscription", "profile"].includes(overlay.type) &&
        !str("name"))
    ) {
      setError("Введите название — поле не может состоять из пробелов.");
      return;
    }
    if (
      overlay.type === "transaction" &&
      kind === "transfer" &&
      account === destination
    ) {
      setError("Выберите разные счета для перевода.");
      return;
    }
    setBusy(true);
    try {
      if (overlay.type === "transaction")
        s.saveTransaction({
          id: tx?.id || uid(),
          kind,
          amount: num("amount"),
          merchant: str("merchant"),
          category:
            kind === "income"
              ? "Доходы"
              : kind === "transfer"
                ? "Перевод"
                : category,
          date: str("date"),
          account,
          destination: kind === "transfer" ? destination : undefined,
          comment: str("comment"),
          tags: str("tags"),
        });
      else if (overlay.type === "budget")
        s.setBudget(overlay.category, num("amount"));
      else if (overlay.type === "goal")
        s.saveGoal({
          id: overlay.goal?.id || uid(),
          name: str("name"),
          target: num("target"),
          saved: num("saved"),
        });
      else if (overlay.type === "subscription")
        s.saveSubscription({
          id: overlay.subscription?.id || uid(),
          name: str("name"),
          amount: num("amount"),
          date: str("date"),
        });
      else s.setName(str("name"));
      finish("Изменения сохранены");
    } catch {
      setError(
        "Не удалось сохранить данные. Проверьте свободное место в браузере.",
      );
      setBusy(false);
    }
  };
  const title =
    overlay.type === "transaction"
      ? editing
        ? tx
          ? "Изменить операцию"
          : "Добавить операцию"
        : "Детали операции"
      : overlay.type === "budget"
        ? "Бюджет категории"
        : overlay.type === "goal"
          ? overlay.goal
            ? "Изменить цель"
            : "Новая цель"
          : overlay.type === "subscription"
            ? overlay.subscription
              ? "Изменить подписку"
              : "Новая подписка"
            : "Профиль";
  return (
    <Drawer title={title} close={close}>
      {confirm ? (
        <div className="confirm">
          <Trash2 size={32} />
          <h2>
            Удалить{" "}
            {overlay.type === "transaction"
              ? "операцию"
              : overlay.type === "goal"
                ? "цель"
                : "подписку"}
            ?
          </h2>
          <p>Это действие нельзя отменить.</p>
          <button className="danger-button full" onClick={remove}>
            Да, удалить
          </button>
          <button className="secondary full" onClick={() => setConfirm(false)}>
            Отмена
          </button>
        </div>
      ) : !editing && tx ? (
        <>
          <div className="transaction-detail">
            <CategoryIcon category={tx.category} />
            <h2>{tx.merchant}</h2>
            <div className="summary-number">
              {tx.kind === "expense" ? "−" : tx.kind === "income" ? "+" : ""}
              {money(tx.amount)}
            </div>
            <p>{new Date(tx.date).toLocaleString("ru-RU")}</p>
          </div>
          <dl>
            {[
              ["Категория", tx.category],
              ["Счёт", tx.account],
              ...(tx.destination ? [["На счёт", tx.destination]] : []),
              ["Комментарий", tx.comment || "Без комментария"],
              ["Метки", tx.tags || "Без меток"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <button className="primary full" onClick={() => setEditing(true)}>
            <Pencil size={16} />
            Изменить
          </button>
          <button className="danger-text full" onClick={() => setConfirm(true)}>
            <Trash2 size={16} />
            Удалить операцию
          </button>
        </>
      ) : (
        <form onSubmit={submit} className="editor-form">
          {overlay.type === "transaction" ? (
            <>
              <div className="segments type-segments">
                {(
                  [
                    ["expense", "Расход"],
                    ["income", "Доход"],
                    ["transfer", "Перевод"],
                  ] as [Kind, string][]
                ).map(([v, l]) => (
                  <button
                    type="button"
                    key={v}
                    className={kind === v ? "selected" : ""}
                    onClick={() => setKind(v)}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <label>
                Сумма, ₽
                <input
                  className="amount-input"
                  name="amount"
                  type="number"
                  min="1"
                  max="999999999"
                  step="1"
                  required
                  defaultValue={tx?.amount}
                  placeholder="0"
                />
              </label>
              <label>
                {kind === "transfer"
                  ? "Название перевода"
                  : "Название операции"}
                <input
                  name="merchant"
                  required
                  maxLength={80}
                  defaultValue={tx?.merchant}
                  placeholder={
                    kind === "income"
                      ? "Например, зарплата"
                      : kind === "transfer"
                        ? "Между своими счетами"
                        : "Например, ВкусВилл"
                  }
                />
              </label>
              {kind === "expense" && (
                <fieldset>
                  <legend>Категория</legend>
                  <div className="category-grid">
                    {categories.map((c) => (
                      <button
                        type="button"
                        key={c}
                        className={category === c ? "chosen" : ""}
                        onClick={() => setCategory(c)}
                      >
                        <CategoryIcon category={c} />
                        <span>{c}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              <label>
                Дата
                <input
                  name="date"
                  type="datetime-local"
                  required
                  defaultValue={
                    tx?.date ||
                    `${month}-${new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate()}T12:00`
                  }
                />
              </label>
              <label>
                {kind === "transfer" ? "Со счёта" : "Счёт"}
                <select
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                >
                  {accounts.map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </label>
              {kind === "transfer" && (
                <label>
                  На счёт
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  >
                    {accounts.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Комментарий <span className="optional">необязательно</span>
                <textarea
                  name="comment"
                  maxLength={200}
                  defaultValue={tx?.comment}
                  placeholder="Добавьте детали"
                />
              </label>
              <label>
                Метки
                <input
                  name="tags"
                  maxLength={80}
                  defaultValue={tx?.tags}
                  placeholder="Например, работа"
                />
              </label>
            </>
          ) : overlay.type === "budget" ? (
            <>
              <div className="budget-top">
                <CategoryIcon category={overlay.category} />
                <h2>{overlay.category}</h2>
              </div>
              <label>
                Месячный лимит, ₽
                <input
                  name="amount"
                  type="number"
                  min="1"
                  max="999999999"
                  step="1"
                  required
                  defaultValue={s.budgets[overlay.category]}
                />
              </label>
              <p>
                Лимит применяется к каждому месяцу. Расходы рассчитываются по
                операциям.
              </p>
            </>
          ) : overlay.type === "goal" ? (
            <>
              <label>
                Название цели
                <input
                  name="name"
                  required
                  maxLength={60}
                  defaultValue={overlay.goal?.name}
                  placeholder="На что копим?"
                />
              </label>
              <label>
                Целевая сумма, ₽
                <input
                  name="target"
                  type="number"
                  min="1"
                  max="999999999"
                  required
                  defaultValue={overlay.goal?.target}
                />
              </label>
              <label>
                Уже накоплено, ₽
                <input
                  name="saved"
                  type="number"
                  min="0"
                  max="999999999"
                  required
                  defaultValue={overlay.goal?.saved || 0}
                />
              </label>
              <p>Чтобы пополнить цель, укажите новую общую сумму накоплений.</p>
            </>
          ) : overlay.type === "subscription" ? (
            <>
              <label>
                Название
                <input
                  name="name"
                  required
                  maxLength={60}
                  defaultValue={overlay.subscription?.name}
                  placeholder="Название сервиса"
                />
              </label>
              <label>
                Стоимость в месяц, ₽
                <input
                  name="amount"
                  type="number"
                  min="1"
                  max="999999999"
                  required
                  defaultValue={overlay.subscription?.amount}
                />
              </label>
              <label>
                Ближайшее списание
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={overlay.subscription?.date || `${month}-28`}
                />
              </label>
            </>
          ) : (
            <>
              <label>
                Ваше имя
                <input
                  name="name"
                  required
                  maxLength={30}
                  defaultValue={s.name}
                />
              </label>
              <p>
                Данные хранятся только в этом браузере. Демо-период: январь —
                март 2025.
              </p>
            </>
          )}
          {error && (
            <p className="danger" role="alert">
              {error}
            </p>
          )}
          <button className="primary full" disabled={busy}>
            {busy
              ? "Сохранение…"
              : overlay.type === "transaction"
                ? "Сохранить операцию"
                : "Сохранить"}
          </button>
          {((overlay.type === "transaction" && tx) ||
            (overlay.type === "goal" && overlay.goal) ||
            (overlay.type === "subscription" && overlay.subscription)) && (
            <button
              type="button"
              className="danger-text full"
              onClick={() => setConfirm(true)}
            >
              <Trash2 size={16} />
              Удалить
            </button>
          )}
        </form>
      )}
    </Drawer>
  );
}
