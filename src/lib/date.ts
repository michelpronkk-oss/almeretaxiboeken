export function getAmsterdamTodayString() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" })
}
