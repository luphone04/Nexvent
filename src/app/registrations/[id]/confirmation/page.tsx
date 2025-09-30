import { AppLayout } from '@/components/layout/app-layout'
import { RegistrationConfirmation } from '@/components/registration/registration-confirmation'

interface ConfirmationPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { id } = await params

  return (
    <AppLayout>
      <RegistrationConfirmation registrationId={id} />
    </AppLayout>
  )
}