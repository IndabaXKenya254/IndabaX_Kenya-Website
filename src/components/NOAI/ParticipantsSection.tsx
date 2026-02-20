// ═══════════════════════════════════════════════════════════════════════
// Participants Section - Server Component that fetches data
// SERVER COMPONENT - Converted to SSR for faster initial load
// ═══════════════════════════════════════════════════════════════════════

import { createNoCachePublicClient } from '@/lib/supabase'
import ParticipantsDisplay from './ParticipantsDisplay'

interface Participant {
  id: string
  year: number
  name: string
  school: string | null
  role: 'contestant' | 'team_leader' | 'deputy_leader' | 'observer'
  photo_url: string | null
  achievement: 'gold' | 'silver' | 'bronze' | 'honorable_mention' | 'participant' | null
  bio: string | null
  display_order: number
}

interface ParticipantsData {
  [year: number]: Participant[]
}

async function getParticipants(): Promise<ParticipantsData> {
  try {
    const supabase = createNoCachePublicClient()

    const { data, error } = await supabase
      .from('noai_participants')
      .select('*')
      .eq('is_published', true) // Only show published participants
      .order('year', { ascending: false })
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching participants:', error)
      return {}
    }

    // Group by year
    const grouped: ParticipantsData = {}
    ;(data as Participant[]).forEach(participant => {
      if (!grouped[participant.year]) {
        grouped[participant.year] = []
      }
      grouped[participant.year].push(participant)
    })

    return grouped
  } catch (error) {
    console.error('Error loading participants:', error)
    return {}
  }
}

export default async function ParticipantsSection() {
  const participantsData = await getParticipants()

  if (Object.keys(participantsData).length === 0) {
    return null
  }

  return (
    <section className="participants-section ptb-120">
      <div className="container">
        <ParticipantsDisplay participantsData={participantsData} />
      </div>
    </section>
  )
}
