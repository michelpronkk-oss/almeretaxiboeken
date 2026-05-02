import { getValidDriverInviteByToken } from "@/lib/chauffeur/invites"
import ChauffeurOnboardingWizard, { OnboardingInvalidCard, OnboardingSuccessCard } from "@/components/chauffeur/ChauffeurOnboardingWizard"

type SearchParams = Promise<{ token?: string; success?: string; error?: string }>

export default async function ChauffeurOnboardingPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams

  if (params.success === "1") {
    return <OnboardingSuccessCard />
  }

  const token = String(params.token || "").trim()
  if (!token) {
    return <OnboardingInvalidCard />
  }

  const invite = await getValidDriverInviteByToken(token)
  if (!invite) {
    return <OnboardingInvalidCard />
  }

  return <ChauffeurOnboardingWizard token={token} email={invite.email} error={params.error} />
}
