import { formatDistanceToNow, formatDistance } from "date-fns";

export function formatTimeRemaining(date: Date | string): string {
  const expiryDate = typeof date === "string" ? new Date(date) : date;
  const now = new Date();

  if (expiryDate < now) {
    return "Термін дії минув";
  }

  const totalSeconds = Math.floor(
    (expiryDate.getTime() - now.getTime()) / 1000
  );

  if (totalSeconds < 60) {
    return `${totalSeconds}сек.`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) {
    return `${minutes}хв.`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    return `${hours}год. ${remainingMinutes}хв.`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (days < 7) {
    return `${days}д. ${remainingHours}год.`;
  }

  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;

  return `${weeks}тиж. ${remainingDays}д.`;
}

export function getExpiryClassName(date: Date | string): string {
  const expiryDate = typeof date === "string" ? new Date(date) : date;
  const now = new Date();

  if (expiryDate < now) {
    return "bg-muted/10 text-muted-all";
  }

  const hoursLeft = Math.floor(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60)
  );

  if (hoursLeft < 1) {
    return "bg-warning/10 text-warning";
  } else if (hoursLeft < 24) {
    return "bg-warning/10 text-warning";
  } else {
    return "bg-warning/10 text-warning";
  }
}
