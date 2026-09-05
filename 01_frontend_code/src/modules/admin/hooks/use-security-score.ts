import { useEffect, useState } from 'react'

export function useSecurityScoreAnimation(targetScore: number, isLoading: boolean) {
  const [score, setScore] = useState(1)

  useEffect(() => {
    if (isLoading || targetScore === undefined) return
    let frame = 0
    setScore(1)
    const id = window.setInterval(() => {
      frame += 1
      const next = Math.min(targetScore, Math.round((frame / 30) * targetScore))
      setScore(next)
      if (next >= targetScore) window.clearInterval(id)
    }, 20)
    return () => window.clearInterval(id)
  }, [targetScore, isLoading])

  return score
}