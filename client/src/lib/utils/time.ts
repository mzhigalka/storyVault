import { formatDistanceToNow, formatDistance } from "date-fns";

export function formatTimeRemaining(date: Date | string): string {
  const expiryDate = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  
  // If date is in the past
  if (expiryDate < now) {
    return "Expired";
  }
  
  const totalSeconds = Math.floor((expiryDate.getTime() - now.getTime()) / 1000);
  
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    return `${hours}h ${remainingMinutes}m`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (days < 7) {
    return `${days}d ${remainingHours}h`;
  }
  
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  
  return `${weeks}w ${remainingDays}d`;
}

export function getExpiryClassName(date: Date | string): string {
  const expiryDate = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  
  // If date is in the past
  if (expiryDate < now) {
    return "bg-muted/10 text-muted";
  }
  
  const hoursLeft = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60));
  
  if (hoursLeft < 1) {
    return "bg-error/10 text-error";
  } else if (hoursLeft < 24) {
    return "bg-warning/10 text-warning";
  } else {
    return "bg-secondary/10 text-secondary";
  }
}
