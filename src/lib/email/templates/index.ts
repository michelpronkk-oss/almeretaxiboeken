import { renderBaseEmail } from "@/lib/email/templates/base"
import { dateNl, euro, vehicleLabel } from "@/lib/email/templates/components"

export interface BookingEmailData {
  reference: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  origin: string
  destination: string
  date: string
  time: string
  vehicleType?: string
  passengers?: number
  price: number
  bookingUrl?: string
}

export function customerBookingConfirmedEmail(data: BookingEmailData) {
  return {
    subject: `Uw rit is bevestigd - ${data.reference}`,
    ...renderBaseEmail({
      preheader: "Uw betaling is ontvangen en uw rit is bevestigd.",
      label: "Boekingsbevestiging",
      title: "Uw rit is bevestigd",
      intro: "Uw betaling is ontvangen. Uw rit is definitief gereserveerd bij AlmereTaxiBoeken.",
      details: [
        { label: "Referentie", value: data.reference },
        { label: "Vertrekpunt", value: data.origin },
        { label: "Bestemming", value: data.destination },
        { label: "Datum", value: dateNl(data.date) },
        { label: "Tijd", value: data.time },
        { label: "Voertuigtype", value: vehicleLabel(data.vehicleType) },
        { label: "Passagiers", value: String(data.passengers ?? "-") },
        { label: "Ritprijs", value: euro(data.price) },
      ],
      ctaLabel: data.bookingUrl ? "Bekijk boeking" : undefined,
      ctaUrl: data.bookingUrl,
      fallbackLinkUrl: data.bookingUrl,
      note: "Bij vragen kunt u contact opnemen via WhatsApp of telefoon.",
    }),
  }
}

export function internalPaidBookingEmail(data: BookingEmailData) {
  return {
    subject: `Nieuwe betaalde rit - ${data.reference}`,
    ...renderBaseEmail({
      preheader: "Er is een nieuwe betaalde rit binnengekomen.",
      label: "Interne melding",
      title: "Nieuwe betaalde rit",
      intro: "Er is een nieuwe rit betaald en bevestigd. Deze rit staat klaar in het adminpaneel.",
      details: [
        { label: "Referentie", value: data.reference },
        { label: "Klantnaam", value: data.customerName || "-" },
        { label: "E-mail", value: data.customerEmail || "-" },
        { label: "Telefoon", value: data.customerPhone || "-" },
        { label: "Vertrekpunt", value: data.origin },
        { label: "Bestemming", value: data.destination },
        { label: "Datum", value: dateNl(data.date) },
        { label: "Tijd", value: data.time },
        { label: "Voertuigtype", value: vehicleLabel(data.vehicleType) },
        { label: "Passagiers", value: String(data.passengers ?? "-") },
        { label: "Ritprijs", value: euro(data.price) },
      ],
      ctaLabel: "Open adminpaneel",
      ctaUrl: `${(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")}/admin/ritten`,
      fallbackLinkUrl: `${(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")}/admin/ritten`,
    }),
  }
}

export function chauffeurInviteEmail(inviteUrl: string) {
  return {
    subject: "Uitnodiging voor het AlmereTaxiBoeken chauffeurportaal",
    ...renderBaseEmail({
      preheader: "Maak uw chauffeurprofiel compleet en upload uw documenten.",
      label: "Chauffeurportaal",
      title: "Uw chauffeurprofiel aanmaken",
      intro: "U bent uitgenodigd om uw chauffeurprofiel aan te maken voor AlmereTaxiBoeken. Via de beveiligde link vult u uw gegevens aan en uploadt u de gevraagde documenten.",
      details: [
        { label: "Checklist", value: "Persoonsgegevens" },
        { label: "Checklist", value: "Voertuiggegevens" },
        { label: "Checklist", value: "Rijbewijs en chauffeurspas" },
      ],
      ctaLabel: "Profiel aanmaken",
      ctaUrl: inviteUrl,
      fallbackLinkUrl: inviteUrl,
      note: "Deze uitnodigingslink is persoonlijk en tijdelijk geldig.",
    }),
  }
}

export function chauffeurApprovedEmail(accessUrl: string) {
  return {
    subject: "Uw chauffeurprofiel is goedgekeurd",
    ...renderBaseEmail({
      preheader: "U kunt nu inloggen op het AlmereTaxiBoeken chauffeurportaal.",
      label: "Chauffeurportaal",
      title: "Uw profiel is goedgekeurd",
      intro: "Uw chauffeurprofiel is gecontroleerd en goedgekeurd. U kunt nu inloggen op het chauffeurportaal en uw toegewezen ritten bekijken.",
      ctaLabel: "Inloggen op chauffeurportaal",
      ctaUrl: accessUrl,
      fallbackLinkUrl: accessUrl,
      note: "Deze link is persoonlijk en tijdelijk geldig. Deel deze link niet met anderen.",
    }),
  }
}

export function chauffeurLoginLinkEmail(accessUrl: string) {
  return {
    subject: "Uw inloglink voor het chauffeurportaal",
    ...renderBaseEmail({
      preheader: "Gebruik deze beveiligde link om in te loggen.",
      label: "Chauffeurportaal",
      title: "Inloggen op chauffeurportaal",
      intro: "Gebruik onderstaande beveiligde link om in te loggen op uw chauffeurportaal.",
      ctaLabel: "Inloggen",
      ctaUrl: accessUrl,
      fallbackLinkUrl: accessUrl,
      note: "Deze link is tijdelijk geldig en persoonlijk.",
    }),
  }
}

export function chauffeurOnboardingSubmittedAdminEmail(data: {
  driverId: string
  name: string
  email: string
  phone?: string
  vehicleType?: string
  licensePlate?: string
}) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")
  const reviewUrl = `${base}/admin/chauffeurs/${data.driverId}`

  return {
    subject: `Chauffeurprofiel wacht op controle - ${data.name || data.email}`,
    ...renderBaseEmail({
      preheader: "Een chauffeur heeft het profiel aangevuld.",
      label: "Interne controle",
      title: "Chauffeurprofiel ingediend",
      intro: "Een chauffeur heeft de onboarding afgerond. Controleer de gegevens en documenten in het adminpaneel.",
      details: [
        { label: "Naam", value: data.name || "-" },
        { label: "E-mail", value: data.email },
        { label: "Telefoon", value: data.phone || "-" },
        { label: "Voertuigtype", value: vehicleLabel(data.vehicleType) },
        { label: "Kenteken", value: data.licensePlate || "-" },
      ],
      ctaLabel: "Chauffeur controleren",
      ctaUrl: reviewUrl,
      fallbackLinkUrl: reviewUrl,
    }),
  }
}

export function driverAssignedRideEmail(data: {
  reference: string
  origin: string
  destination: string
  date: string
  time: string
  customerName?: string
  customerPhone?: string
  vehicleType?: string
  passengers?: number
  price?: number
  notes?: string
}) {
  const portalUrl = `${(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")}/chauffeur/ritten`

  return {
    subject: `Nieuwe rit toegewezen - ${data.reference}`,
    ...renderBaseEmail({
      preheader: "Er is een nieuwe rit aan u toegewezen.",
      label: "Chauffeurportaal",
      title: "Nieuwe rit toegewezen",
      intro: "Er is een rit aan u toegewezen. Bekijk de ritdetails in het chauffeurportaal.",
      details: [
        { label: "Referentie", value: data.reference },
        { label: "Datum", value: dateNl(data.date) },
        { label: "Tijd", value: data.time },
        { label: "Vertrekpunt", value: data.origin },
        { label: "Bestemming", value: data.destination },
        { label: "Klantnaam", value: data.customerName || "-" },
        { label: "Telefoonnummer klant", value: data.customerPhone || "-" },
        { label: "Voertuigtype", value: vehicleLabel(data.vehicleType) },
        { label: "Passagiers", value: String(data.passengers ?? "-") },
        { label: "Ritprijs", value: typeof data.price === "number" ? euro(data.price) : "-" },
        ...(data.notes ? [{ label: "Opmerkingen", value: data.notes }] : []),
      ],
      ctaLabel: "Rit bekijken",
      ctaUrl: portalUrl,
      fallbackLinkUrl: portalUrl,
    }),
  }
}

export function cashBookingRequestEmail(data: {
  reference: string
  date: string
  time: string
  origin: string
  destination: string
  passengers: number
  vehicleType?: string
  price: number
  customerName?: string
}) {
  return {
    subject: `Uw rit is aangevraagd bij AlmereTaxiBoeken - ${data.reference}`,
    ...renderBaseEmail({
      preheader: "Uw rit is ontvangen. U betaalt contant bij de chauffeur.",
      label: "Ritaanvraag",
      title: "Uw rit is aangevraagd",
      intro: "Uw ritaanvraag is ontvangen bij AlmereTaxiBoeken. U betaalt contant bij de chauffeur.",
      details: [
        { label: "Referentie", value: data.reference },
        { label: "Datum", value: dateNl(data.date) },
        { label: "Tijd", value: data.time },
        { label: "Ophaaladres", value: data.origin },
        { label: "Bestemming", value: data.destination },
        { label: "Aantal personen", value: String(data.passengers) },
        { label: "Voertuig", value: vehicleLabel(data.vehicleType) },
        { label: "Ritprijs", value: euro(data.price) },
        { label: "Betaalwijze", value: "Contant bij chauffeur" },
      ],
      note: "Bewaar uw referentienummer. De planning kan contact opnemen bij vragen. Geen online betaling vereist.",
    }),
  }
}

export function internalCashBookingEmail(data: BookingEmailData & { cashAmount: number }) {
  return {
    subject: `Nieuwe contante boeking - ${data.reference}`,
    ...renderBaseEmail({
      preheader: "Er is een nieuwe contante boeking binnengekomen.",
      label: "Interne melding",
      title: "Nieuwe contante boeking",
      intro: "Er is een nieuwe rit aangevraagd met contante betaling. Wijs een chauffeur toe.",
      details: [
        { label: "Referentie", value: data.reference },
        { label: "Klantnaam", value: data.customerName || "-" },
        { label: "E-mail", value: data.customerEmail || "-" },
        { label: "Telefoon", value: data.customerPhone || "-" },
        { label: "Vertrekpunt", value: data.origin },
        { label: "Bestemming", value: data.destination },
        { label: "Datum", value: dateNl(data.date) },
        { label: "Tijd", value: data.time },
        { label: "Voertuigtype", value: vehicleLabel(data.vehicleType) },
        { label: "Passagiers", value: String(data.passengers ?? "-") },
        { label: "Te innen", value: euro(data.cashAmount) },
        { label: "Betaalwijze", value: "Contant bij chauffeur" },
      ],
      ctaLabel: "Open adminpaneel",
      ctaUrl: `${(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")}/admin/ritten`,
      fallbackLinkUrl: `${(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")}/admin/ritten`,
    }),
  }
}

export function manualPaymentLinkEmail(data: {
  reference: string
  date: string
  time: string
  origin: string
  destination: string
  passengers: number
  vehicleType?: string
  price: number
  paymentUrl: string
}) {
  return {
    subject: "Betaallink voor uw rit met AlmereTaxiBoeken",
    ...renderBaseEmail({
      preheader: "Betaal veilig online om uw rit definitief te reserveren.",
      label: "Boekingsbetaling",
      title: "Uw rit reserveren",
      intro: "Uw rit is aangemaakt door AlmereTaxiBoeken. Betaal veilig online om de reservering definitief te maken.",
      details: [
        { label: "Referentie", value: data.reference },
        { label: "Datum", value: dateNl(data.date) },
        { label: "Tijd", value: data.time },
        { label: "Ophaaladres", value: data.origin },
        { label: "Bestemming", value: data.destination },
        { label: "Aantal personen", value: String(data.passengers) },
        { label: "Voertuig", value: vehicleLabel(data.vehicleType) },
        { label: "Ritprijs", value: euro(data.price) },
      ],
      ctaLabel: "Rit betalen",
      ctaUrl: data.paymentUrl,
      fallbackLinkUrl: data.paymentUrl,
      note: "Na betaling is uw rit definitief gereserveerd.",
    }),
  }
}
