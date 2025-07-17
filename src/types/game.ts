export interface Ball {
  x: number
  y: number
  radius: number
  speed: number
  dx: number
  dy: number
  color: string
}

export interface Paddle {
  x: number
  y: number
  width: number
  height: number
  color: string
  dx: number
  acceleration: number
  maxSpeed: number
}

export interface Brick {
  x: number
  y: number
  status: number // 0 = destroyed, 1 = active
  hits: number // how many hits to destroy
}

export interface PowerUp {
  x: number
  y: number
  type: PowerUpType
  color: string
  dy: number
}

export type PowerUpType = 'fire' | 'sticky' | 'extraBall' | 'slowDown' | 'speedUp' | 'clearGood'

export interface Particle {
  x: number
  y: number
  radius: number
  color: string
  dx: number
  dy: number
  life: number
}

export interface Notification {
  text: string
  time: number
}

export interface GameState {
  score: number
  lives: number
  level: number
  gameOver: boolean
  gameStarted: boolean
  gamePaused: boolean
  initialStart: boolean
  gameWon: boolean
  stickyBall: boolean
  fireBall: boolean
}

export interface LevelData {
  id: number
  name: string
  bricks: {
    rows: number
    cols: number
    layout: number[][]
  }
  ballSpeed: number
  lives: number
  powerUpChance: number
}

export interface BrickInfo {
  width: number
  height: number
  padding: number
  offsetTop: number
  offsetLeft: number
  color: string[]
} 