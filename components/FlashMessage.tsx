'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  type: 'success' | 'error'
  text: string
  duration?: number // ms
}

export default function FlashMessage({ type, text, duration = 3500 }: Props) {
  const router = useRouter()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), duration)
    return () => clearTimeout(t)
  }, [duration])

  useEffect(() => {
    if (!visible) {
      // remove query params 'success' and 'error' da URL sem reload
      const url = new URL(window.location.href)
      url.searchParams.delete('success')
      url.searchParams.delete('error')
      // usa replace para não adicionar histórico
      router.replace(url.pathname + (url.search ? '?' + url.searchParams.toString() : ''))
    }
  }, [visible, router])

  if (!visible) return null

  const bg = type === 'success' ? 'bg-green-600' : 'bg-red-600'
  const icon = type === 'success' ? '✓' : '⚠'

  return (
    <div className={`fixed top-6 right-6 z-50 max-w-sm ${bg} text-white rounded-lg shadow-lg p-4 flex items-start gap-3`}>
      <div className="text-xl font-bold">{icon}</div>
      <div className="text-sm">
        <div className="font-semibold">{type === 'success' ? 'Sucesso' : 'Erro'}</div>
        <div className="mt-1">{text}</div>
      </div>
    </div>
  )
}