import { create } from "zustand";
import { persist } from "zustand/middleware";
export type Kind = "expense" | "income" | "transfer";
export interface Transaction {
  id: string;
  kind: Kind;
  amount: number;
  merchant: string;
  category: string;
  date: string;
  account: string;
  destination?: string;
  comment: string;
  tags: string;
}
export interface Subscription {
  id: string;
  name: string;
  amount: number;
  date: string;
}
export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
}
export const categories = [
  "Продукты",
  "Рестораны",
  "Транспорт",
  "Покупки",
  "Развлечения",
  "Здоровье",
  "Жильё",
  "Другое",
];
export const accounts = ["Карта Т-Банк", "Счёт в Сбербанке", "Наличные"];
export const money = (value: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
export const monthLabel = (month: string) =>
  new Date(month + "-01T12:00:00")
    .toLocaleDateString("ru-RU", { month: "long", year: "numeric" })
    .replace(" г.", "");
export const signed = (t: Transaction) =>
  t.kind === "income" ? t.amount : t.kind === "expense" ? -t.amount : 0;
export const total = (items: Transaction[], kind: Kind) =>
  items.filter((t) => t.kind === kind).reduce((a, t) => a + t.amount, 0);
export const uid = () => crypto.randomUUID();
function seed(): Transaction[] {
  const result: Transaction[] = [];
  const merchants = [
    "Перекрёсток",
    "Кофемания",
    "Яндекс Такси",
    "Ozon",
    "Steam",
    "Аптека",
    "Коммунальные услуги",
    "YouTube Premium",
  ];
  const amounts = [12400, 8700, 3200, 7800, 4100, 3300, 17373, 947];
  for (let m = 1; m <= 3; m++) {
    const month = `2025-0${m}`;
    for (let c = 0; c < 8; c++)
      for (let n = 0; n < 4; n++)
        result.push({
          id: `e-${m}-${c}-${n}`,
          kind: "expense",
          amount: Math.round(
            (amounts[c] / 4) * (m === 3 ? 1 : m === 2 ? 1.044 : 0.89),
          ),
          merchant: c === 0 && n % 2 ? "ВкусВилл" : merchants[c],
          category: categories[c],
          date: `${month}-${String(Math.min(m === 2 ? 28 : 31, 3 + n * 8 + (c % 3))).padStart(2, "0")}T${n % 2 ? "18:24" : "09:41"}`,
          account: accounts[c % 2],
          comment: "",
          tags: c === 6 ? "Обязательное" : "",
        });
    result.push(
      ...[120000, 42000, 20400].map(
        (amount, i): Transaction => ({
          id: `i-${m}-${i}`,
          kind: "income",
          amount: m === 3 ? amount : Math.round(amount * 0.925),
          merchant: i === 0 ? "Зарплата" : "Фриланс",
          category: "Доходы",
          date: `${month}-${["10", "20", "28"][i]}T10:00`,
          account: accounts[1],
          comment: "",
          tags: "Работа",
        }),
      ),
    );
  }
  return result;
}
interface Store {
  transactions: Transaction[];
  budgets: Record<string, number>;
  subscriptions: Subscription[];
  goals: Goal[];
  name: string;
  saveTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  setBudget: (category: string, amount: number) => void;
  saveSubscription: (s: Subscription) => void;
  deleteSubscription: (id: string) => void;
  saveGoal: (g: Goal) => void;
  deleteGoal: (id: string) => void;
  setName: (name: string) => void;
}
export const useStore = create<Store>()(
  persist(
    (set) => ({
      transactions: seed(),
      budgets: {
        Продукты: 20000,
        Рестораны: 15000,
        Транспорт: 5000,
        Развлечения: 10000,
        Покупки: 22000,
        Здоровье: 10000,
        Жильё: 40000,
        Другое: 10000,
      },
      subscriptions: [
        { id: "s1", name: "YouTube Premium", amount: 249, date: "2025-04-10" },
        { id: "s2", name: "Яндекс Плюс", amount: 399, date: "2025-04-15" },
        { id: "s3", name: "Spotify", amount: 299, date: "2025-04-21" },
      ],
      goals: [
        { id: "g1", name: "Новый ноутбук", saved: 68000, target: 120000 },
        { id: "g2", name: "Отпуск", saved: 42000, target: 100000 },
      ],
      name: "Артём",
      saveTransaction: (t) =>
        set((s) => ({
          transactions: [...s.transactions.filter((x) => x.id !== t.id), t],
        })),
      deleteTransaction: (id) =>
        set((s) => ({
          transactions: s.transactions.filter((t) => t.id !== id),
        })),
      setBudget: (category, amount) =>
        set((s) => ({ budgets: { ...s.budgets, [category]: amount } })),
      saveSubscription: (x) =>
        set((s) => ({
          subscriptions: [...s.subscriptions.filter((t) => t.id !== x.id), x],
        })),
      deleteSubscription: (id) =>
        set((s) => ({
          subscriptions: s.subscriptions.filter((t) => t.id !== id),
        })),
      saveGoal: (x) =>
        set((s) => ({ goals: [...s.goals.filter((t) => t.id !== x.id), x] })),
      deleteGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((t) => t.id !== id) })),
      setName: (name) => set({ name }),
    }),
    { name: "saldo-v1" },
  ),
);
export function monthData(transactions: Transaction[], month: string) {
  return transactions
    .filter((t) => t.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date));
}
const seedTransactions = seed();
export const openingBalance =
  124580 - seedTransactions.reduce((s, t) => s + signed(t), 0);
export const balanceAt = (transactions: Transaction[], end: string) =>
  openingBalance +
  transactions
    .filter((t) => t.date.slice(0, 10) <= end)
    .reduce((s, t) => s + signed(t), 0);
