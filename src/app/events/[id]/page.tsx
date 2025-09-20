import { AppLayout } from "@/components/layout/app-layout"
import { EventDetailView } from "@/components/events/event-detail-view"

interface EventDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params

  return (
    <AppLayout>
      <EventDetailView eventId={id} />
    </AppLayout>
  )
}