import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"

const sections = [
  {
    title: "1. Overzicht",
    body: [
      "Websiteboekingen komen binnen na online betaling.",
      "Handmatige ritten kunnen via admin worden aangemaakt.",
      "Betaalde ritten verschijnen in planning.",
      "Chauffeurs worden pas toegewezen door admin.",
    ],
  },
  {
    title: "2. Betalingen",
    body: [
      "Klant betaalt via Mollie.",
      "Rit is pas definitief na succesvolle betaling.",
      "Bij betaalde ritten staat payment_status = paid.",
      "Refunds worden niet automatisch verwerkt.",
      "Eventuele terugbetalingen moeten handmatig via Mollie worden beoordeeld.",
    ],
  },
  {
    title: "3. Chauffeurs",
    body: [
      "Chauffeurs worden uitgenodigd via e-mail.",
      "Chauffeur vult profiel en documenten in.",
      "Admin keurt chauffeur goed.",
      "Alleen actieve/goedgekeurde chauffeurs kunnen ritten ontvangen.",
    ],
  },
  {
    title: "4. Ritten toewijzen",
    body: [
      "Admin wijst ritten toe in /admin/ritten.",
      "Systeem controleert buffertijd.",
      "Standaard buffer is 45 minuten.",
      "Voor taxibus/lange/luchthavenritten is buffer 60 minuten.",
      "Bij conflict kan admin eventueel bewust overrulen.",
    ],
  },
  {
    title: "5. Ritstatussen",
    body: [
      "unassigned: betaald, nog geen chauffeur",
      "assigned: chauffeur toegewezen",
      "accepted: chauffeur heeft rit geaccepteerd",
      "on_the_way: chauffeur is onderweg",
      "arrived: chauffeur is aangekomen",
      "in_progress: rit is gestart",
      "completed: rit afgerond",
      "no_show_reported: chauffeur meldt klant niet aanwezig",
      "issue_reported: chauffeur meldt probleem",
      "cancelled: admin heeft rit geannuleerd",
    ],
  },
  {
    title: "6. No-show",
    body: [
      "Chauffeur kan no-show alleen melden na aankomst en wachttijd.",
      "Admin beoordeelt daarna wat er moet gebeuren.",
      "Er wordt niet automatisch terugbetaald.",
    ],
  },
  {
    title: "7. Problemen onderweg",
    body: [
      "Chauffeur kan probleem melden.",
      "Admin ziet dit in probleemfilter.",
      "Admin kan klant contacteren, opnieuw toewijzen of annuleren.",
    ],
  },
  {
    title: "8. Last-minute ritten",
    body: [
      "Online klanten kunnen niet binnen 60 minuten vooraf betalen/boeken.",
      "Voor ritten binnen 60 minuten wordt klant gevraagd te bellen of WhatsAppen.",
      "Admin kan handmatig ritten invoeren indien planning het toelaat.",
    ],
  },
  {
    title: "9. Omzet en KPI's",
    body: [
      "Omzet wordt berekend op basis van betaalde boekingen.",
      "Pending/geannuleerde/mislukte betalingen tellen niet mee.",
      "Analytics kan via GTM/GA4 worden gebruikt voor websiteprestaties.",
    ],
  },
  {
    title: "10. Dagelijkse werkwijze",
    body: [
      "Controleer nieuwe betaalde ritten",
      "Wijs chauffeur toe",
      "Check conflicten/buffers",
      "Controleer probleem/no-show meldingen",
      "Controleer betaling/omzet",
      "Verwerk eventuele wijzigingen of refunds handmatig",
    ],
  },
  {
    title: "12. Eigenaar en planning",
    body: [
      "Het account fntaxi87@gmail.com is ingesteld als eigenaar/chauffeur.",
      "Nieuwe ritten worden standaard automatisch aan dit account gekoppeld.",
      "De eigenaar kan vanuit het chauffeurportaal ritten doorzetten naar andere chauffeurs.",
      "Normale chauffeurs zien alleen hun eigen toegewezen ritten.",
      "Eigenaar en dispatcher krijgen badges 'Eigenaar' en 'Planning' te zien in het portaal.",
      "Toewijzing vanuit het chauffeurportaal gebruikt POST /api/chauffeur/bookings/assign-driver.",
    ],
  },
  {
    title: "13. Testdata verwijderen",
    body: [
      "Chauffeurs en ritten worden veilig verwijderd via soft delete (deleted_at wordt gezet).",
      "Verwijderde items verdwijnen uit planning, lijsten en KPI's.",
      "Historische koppelingen blijven technisch behouden in de database.",
      "De standaard eigenaar/chauffeur kan niet worden verwijderd via de interface.",
      "Chauffeurs verwijderen: /admin/chauffeurs → 'Verwijderen' knop per rij.",
      "Ritten verwijderen: /admin/ritten → 'Rit verwijderen' knop per rit.",
      "Verwijdering vereist bevestiging en heeft een optioneel redenveld.",
    ],
  },
  {
    title: "11. Vaste Schipholtarieven en prijsaanpassingen",
    body: [
      "AlmereTaxiBoeken past automatisch vaste routeprijzen toe voor bekende Schipholritten.",
      "Huidige vaste routes: Almere ↔ Schiphol (Taxi €80 / Taxibus €95), Lelystad ↔ Schiphol (Taxi €110 / Taxibus €125), Hilversum ↔ Schiphol (Taxi €75 / Taxibus €90).",
      "Bij een vaste route wordt de badge 'Vaste routeprijs' getoond in het ritoverzicht.",
      "Taxibus heeft een eigen prijs per route. Dit is een interne prijs- en voertuigcorrectie, geen officiële Rijksoverheid-toeslag.",
      "Admin kan bij het aanmaken van een handmatige rit het voertuigtype (Taxi/Taxibus) handmatig kiezen, ongeacht het aantal passagiers.",
      "Admin kan de eindprijs handmatig overschrijven via 'Prijs handmatig aanpassen'. Een reden is verplicht.",
      "Mogelijke redenen: Vaste Schipholprijs, Telefonische afspraak, Korting, Routecorrectie, Wacht-/extra kosten, Anders.",
      "De Mollie betaallink gebruikt altijd de eindprijs (vaste route, berekend of handmatig).",
      "Klant ziet alleen de eindprijs. Interne berekening en reden zijn uitsluitend zichtbaar voor admin.",
      "In het ritoverzicht: 'Handmatig aangepast' badge bij prijsoverschrijving. Reden en berekende prijs worden als auditinfo getoond.",
    ],
  },
]

export default async function AdminDocsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login")
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Handleiding</h1>
        <p className="mt-2 text-sm text-[#B7AEA2]">Uitleg over boekingen, betalingen, chauffeurs en planning.</p>
      </div>

      <div className="rounded-xl border border-[#D6B58A]/20 bg-[#D6B58A]/10 p-4 text-xs text-[#D6B58A]">
        Refunds worden niet automatisch verwerkt. Controleer Mollie handmatig indien nodig.
      </div>

      <div className="grid gap-4">
        {sections.map((s) => (
          <article key={s.title} className="rounded-2xl border border-[#292520] bg-[#141210] p-5">
            <h2 className="text-lg font-semibold text-[#F5F1E8]">{s.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-[#B7AEA2]">
              {s.body.map((line) => (
                <li key={line} className="flex gap-2"><span className="mt-1 size-1.5 rounded-full bg-[#3A2D1F]" />{line}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
