// Legacy file kept as adapter while migrating to shared branded templates.
import { customerBookingConfirmedEmail, internalPaidBookingEmail } from "@/lib/email/templates"

interface BookingData {
  bookingRef: string
  name: string
  phone: string
  email: string
  origin: string
  destination: string
  date: string
  time: string
  voertuig: string
  price: number
}

export function customerEmailHtml(d: BookingData): string {
  const vehicleType = d.voertuig.toLowerCase().includes("bus") ? "taxibus" : "taxi"
  return customerBookingConfirmedEmail({
    reference: d.bookingRef,
    customerName: d.name,
    customerEmail: d.email,
    customerPhone: d.phone,
    origin: d.origin,
    destination: d.destination,
    date: d.date,
    time: d.time,
    vehicleType,
    price: d.price,
  }).html
}

export function companyEmailHtml(d: BookingData): string {
  const vehicleType = d.voertuig.toLowerCase().includes("bus") ? "taxibus" : "taxi"
  return internalPaidBookingEmail({
    reference: d.bookingRef,
    customerName: d.name,
    customerEmail: d.email,
    customerPhone: d.phone,
    origin: d.origin,
    destination: d.destination,
    date: d.date,
    time: d.time,
    vehicleType,
    price: d.price,
  }).html
}
