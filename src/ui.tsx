import {
  ShoppingCart,
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Heart,
  House,
  Ellipsis,
  ArrowDownLeft,
  ArrowLeftRight,
  type LucideIcon,
} from "lucide-react";
import { categories } from "./store";
const icons: LucideIcon[] = [
  ShoppingCart,
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Heart,
  House,
  Ellipsis,
];
export function CategoryIcon({ category }: { category: string }) {
  const index = categories.indexOf(category);
  const Icon =
    category === "Доходы"
      ? ArrowDownLeft
      : category === "Перевод"
        ? ArrowLeftRight
        : icons[index] || Ellipsis;
  return (
    <span className={`category-icon cat-${index}`}>
      <Icon size={19} strokeWidth={1.8} />
    </span>
  );
}
export function Logo() {
  return (
    <span className="logo">
      <svg viewBox="0 0 28 34" aria-hidden="true">
        <path d="M2 8 12 2v25L2 33zM17 12l10 6v15H17z" fill="currentColor" />
      </svg>
      saldo
    </span>
  );
}
export function Progress({ value }: { value: number }) {
  return (
    <div
      className={`progress ${value > 100 ? "over" : ""}`}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
export function Empty({
  text = "Здесь пока нет операций",
  detail = "Добавьте первую операцию, чтобы увидеть движение денег.",
}: {
  text?: string;
  detail?: string;
}) {
  return (
    <div className="empty">
      <ShoppingBag size={30} />
      <h3>{text}</h3>
      <p>{detail}</p>
    </div>
  );
}
