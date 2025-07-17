import { writable } from 'svelte/store'

const HIGH_SCORE_KEY = 'breakait_high_score'

function createHighScoreStore() {
  // Get initial value from localStorage or default to 0
  const initialValue = typeof window !== 'undefined' 
    ? parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10)
    : 0

  const { subscribe, set, update } = writable(initialValue)

  return {
    subscribe,
    updateHighScore: (newScore: number) => {
      update(currentHighScore => {
        const highScore = Math.max(currentHighScore, newScore)
        if (typeof window !== 'undefined') {
          localStorage.setItem(HIGH_SCORE_KEY, highScore.toString())
        }
        return highScore
      })
    },
    reset: () => {
      set(0)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(HIGH_SCORE_KEY)
      }
    }
  }
}

export const highScoreStore = createHighScoreStore() 