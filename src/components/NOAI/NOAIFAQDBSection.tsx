// ═══════════════════════════════════════════════════════════════════════
// NOAI FAQ Section - Server Component that fetches data
// SERVER COMPONENT - Converted to SSR for faster initial load
// ═══════════════════════════════════════════════════════════════════════

import { createPublicClient } from '@/lib/supabase'
import FAQDisplay from './FAQDisplay'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string | null
  display_order: number
}

async function getFAQs(): Promise<FAQ[]> {
  try {
    const supabase = createPublicClient()

    const { data, error } = await supabase
      .from('noai_faqs')
      .select('*')
      .eq('is_published', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching FAQs:', error)
      return []
    }

    return (data as FAQ[]) || []
  } catch (error) {
    console.error('Error loading FAQs:', error)
    return []
  }
}

export default async function NOAIFAQDBSection() {
  const faqs = await getFAQs()

  if (faqs.length === 0) {
    return null
  }

  return (
    <section className="noai-faq-section ptb-120 bg-light">
      <div className="container">
        <FAQDisplay faqs={faqs} />
      </div>
    </section>
  )
}
