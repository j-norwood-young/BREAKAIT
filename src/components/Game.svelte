<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { 
    Ball, Paddle, Brick, PowerUp, Particle, Notification, GameState, BrickInfo 
  } from '../types/game'
  import { audioSystem } from '../systems/audio'
  import { levelManager } from '../systems/levelManager'
  import { highScoreStore } from '../stores/highScore'

  // Canvas and context
  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D

  // Game constants
  const CANVAS_WIDTH = 800
  const CANVAS_HEIGHT = 600

  const brickInfo: BrickInfo = {
    width: 75,
    height: 20,
    padding: 10,
    offsetTop: 30,
    offsetLeft: 30,
    color: ['#f00', '#ff0', '#0f0'] // Red, Yellow, Green for different hit counts
  }

  // Game state
  let gameState: GameState = {
    score: 0,
    lives: 5,
    level: 1,
    gameOver: false,
    gameStarted: false,
    gamePaused: false,
    initialStart: true,
    gameWon: false,
    stickyBall: false,
    fireBall: false
  }

  // Game entities
  let paddle: Paddle = {
    x: CANVAS_WIDTH / 2 - 50,
    y: CANVAS_HEIGHT - 20,
    width: 100,
    height: 10,
    color: '#fff',
    dx: 0,
    acceleration: 0.5,
    maxSpeed: 10
  }

  let balls: Ball[] = []
  let bricks: Brick[][] = []
  let powerUps: PowerUp[] = []
  let particles: Particle[] = []
  let notifications: Notification[] = []

  // Controls
  let rightPressed = false
  let leftPressed = false
  let cheatCode = ''
  const WIN_CHEAT = 'I WIN!'
  const LOSE_CHEAT = 'I LOSE'

  // Touch controls
  let isTouching = false

  // Scoring system
  let lastBrickHitTime = 0

  // Animation frame ID
  let animationId: number
  
  // Frame timing
  let lastTime = 0
  let deltaTime = 0
  const TARGET_FPS = 60
  const FRAME_TIME = 1000 / TARGET_FPS // 16.67ms for 60 FPS

  onMount(async () => {
    ctx = canvas.getContext('2d')!
    
    // Load levels
    await levelManager.loadLevels()
    
    // Initialize game
    initGame()
    
    // Set up event listeners
    setupEventListeners()
    
    // Start game loop with initial timestamp
    lastTime = performance.now()
    gameLoop()
  })

  onDestroy(() => {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
  })

  function setupEventListeners() {
    // Keyboard events
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    
    // Mouse events
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('click', handleClick)
    
    // Touch events
    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: false })

    // Audio initialization
    document.addEventListener('click', () => audioSystem.initAudioOnInteraction())
    document.addEventListener('touchstart', () => audioSystem.initAudioOnInteraction())
    document.addEventListener('keydown', () => audioSystem.initAudioOnInteraction())
  }

  function initGame() {
    const currentLevel = levelManager.getCurrentLevel()
    if (!currentLevel) return

    gameState.lives = currentLevel.lives
    createBall(true)
    createBricks()
  }

  function createBall(isInitial: boolean) {
    const currentLevel = levelManager.getCurrentLevel()
    if (!currentLevel) return

    const newBall: Ball = {
      x: isInitial ? paddle.x + paddle.width / 2 : CANVAS_WIDTH / 2,
      y: isInitial ? paddle.y - 10 : CANVAS_HEIGHT - 30,
      radius: 10,
      speed: currentLevel.ballSpeed,
      dx: currentLevel.ballSpeed,
      dy: -currentLevel.ballSpeed,
      color: '#fff'
    }
    balls = [newBall] // For now, just one ball
  }

  function createBricks() {
    const currentLevel = levelManager.getCurrentLevel()
    if (!currentLevel) return

    bricks = []
    const layout = currentLevel.bricks.layout

    for (let c = 0; c < currentLevel.bricks.cols; c++) {
      bricks[c] = []
      for (let r = 0; r < currentLevel.bricks.rows; r++) {
        const brickX = c * (brickInfo.width + brickInfo.padding) + brickInfo.offsetLeft
        const brickY = r * (brickInfo.height + brickInfo.padding) + brickInfo.offsetTop
        const hits = layout[r] && layout[r][c] ? layout[r][c] : 0
        
        if (hits > 0) {
          bricks[c][r] = { 
            x: brickX, 
            y: brickY, 
            status: 1, 
            hits: hits 
          }
        }
      }
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
      rightPressed = true
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
      leftPressed = true
    } else if (e.code === 'Space' && !gameState.gameStarted) {
      gameState.gameStarted = true
      gameState.initialStart = false
    }
    
    // Handle cheat code
    if (e.key.length === 1) {
      cheatCode += e.key
      if (cheatCode.length > Math.max(WIN_CHEAT.length, LOSE_CHEAT.length)) {
        cheatCode = cheatCode.slice(-Math.max(WIN_CHEAT.length, LOSE_CHEAT.length))
      }
      if (cheatCode === WIN_CHEAT) {
        gameState.gameWon = true
        gameState.gameOver = true
        cheatCode = ''
      } else if (cheatCode === LOSE_CHEAT) {
        gameState.lives = 0
        gameState.gameOver = true
        gameState.gameWon = false
        cheatCode = ''
      }
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
      rightPressed = false
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
      leftPressed = false
    }
  }

  function handleMouseMove(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    
    if (mouseX >= 0 && mouseX <= rect.width) {
      const scaleX = CANVAS_WIDTH / rect.width
      const canvasX = mouseX * scaleX
      paddle.x = canvasX - paddle.width / 2
      
      if (paddle.x < 0) {
        paddle.x = 0
      } else if (paddle.x + paddle.width > CANVAS_WIDTH) {
        paddle.x = CANVAS_WIDTH - paddle.width
      }
    }
  }

  function handleClick() {
    if (gameState.gameOver) {
      restartGame()
    } else if (!gameState.gameStarted) {
      gameState.gameStarted = true
      gameState.initialStart = false
    }
  }

  function handleTouchStart(e: TouchEvent) {
    e.preventDefault()
    isTouching = true
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]
    const touchX = touch.clientX - rect.left
    
    if (touchX >= 0 && touchX <= rect.width) {
      const scaleX = CANVAS_WIDTH / rect.width
      const canvasX = touchX * scaleX
      paddle.x = canvasX - paddle.width / 2
      
      if (paddle.x < 0) {
        paddle.x = 0
      } else if (paddle.x + paddle.width > CANVAS_WIDTH) {
        paddle.x = CANVAS_WIDTH - paddle.width
      }
    }
    
    if (gameState.gameOver) {
      restartGame()
    } else if (!gameState.gameStarted) {
      gameState.gameStarted = true
      gameState.initialStart = false
    }
  }

  function handleTouchMove(e: TouchEvent) {
    e.preventDefault()
    if (isTouching) {
      const rect = canvas.getBoundingClientRect()
      const touch = e.touches[0]
      const touchX = touch.clientX - rect.left
      
      if (touchX >= 0 && touchX <= rect.width) {
        const scaleX = CANVAS_WIDTH / rect.width
        const canvasX = touchX * scaleX
        paddle.x = canvasX - paddle.width / 2
        
        if (paddle.x < 0) {
          paddle.x = 0
        } else if (paddle.x + paddle.width > CANVAS_WIDTH) {
          paddle.x = CANVAS_WIDTH - paddle.width
        }
      }
    }
  }

  function handleTouchEnd(e: TouchEvent) {
    e.preventDefault()
    isTouching = false
  }

  function update() {
    if (gameState.gameOver || gameState.gamePaused) {
      return
    }

    if (!gameState.gameStarted && balls[0]) {
      balls[0].x = paddle.x + paddle.width / 2
      balls[0].y = paddle.y - balls[0].radius
    }

    // Normalize delta time to 60 FPS baseline
    const timeMultiplier = deltaTime / FRAME_TIME

    // Update paddle
    if (rightPressed) {
      paddle.dx += paddle.acceleration * timeMultiplier
      if (paddle.dx > paddle.maxSpeed) {
        paddle.dx = paddle.maxSpeed
      }
    } else if (leftPressed) {
      paddle.dx -= paddle.acceleration * timeMultiplier
      if (paddle.dx < -paddle.maxSpeed) {
        paddle.dx = -paddle.maxSpeed
      }
    } else {
      paddle.dx *= Math.pow(0.9, timeMultiplier) // friction with frame rate compensation
    }

    paddle.x += paddle.dx * timeMultiplier

    if (paddle.x < 0) {
      paddle.x = 0
      paddle.dx = 0
    } else if (paddle.x + paddle.width > CANVAS_WIDTH) {
      paddle.x = CANVAS_WIDTH - paddle.width
      paddle.dx = 0
    }

    // Move ball
    if (gameState.gameStarted && balls[0]) {
      balls[0].x += balls[0].dx * timeMultiplier
      balls[0].y += balls[0].dy * timeMultiplier
    }

    collisionDetection()
    updatePowerUps()
    updateParticles()
    updateNotifications()
  }

  function collisionDetection() {
    if (!balls[0]) return

    const ball = balls[0]

    // Ball and bricks
    for (let c = 0; c < bricks.length; c++) {
      for (let r = 0; r < bricks[c].length; r++) {
        const brick = bricks[c][r]
        if (brick && brick.status === 1) {
          if (
            ball.x + ball.radius > brick.x &&
            ball.x - ball.radius < brick.x + brickInfo.width &&
            ball.y + ball.radius > brick.y &&
            ball.y - ball.radius < brick.y + brickInfo.height
          ) {
            ball.dy = -ball.dy
            audioSystem.playBrickHit()
            
            if (!gameState.fireBall) {
              brick.hits--
              if (brick.hits === 0) {
                brick.status = 0
                
                // Calculate combo scoring based on time since last brick hit
                const currentTime = performance.now()
                const timeSinceLastHit = lastBrickHitTime > 0 ? (currentTime - lastBrickHitTime) / 1000 : 999 // Convert to seconds
                
                let scoreMultiplier = 1
                if (lastBrickHitTime > 0) { // Only apply combo if we had a previous hit
                  // Sliding scale: 0 seconds = 10x (1000 points), 5 seconds = 1x (100 points)
                  if (timeSinceLastHit <= 5) {
                    // Smooth sliding scale from 10x to 1x over 5 seconds
                    const progress = (5 - timeSinceLastHit) / 5 // 0 to 1
                    scoreMultiplier = 1 + (9 * Math.pow(progress, 0.7)) // Exponential curve for more randomness
                  } else {
                    scoreMultiplier = 1 // 100 points
                  }
                }
                
                const baseScore = 100
                const earnedPoints = Math.round(baseScore * scoreMultiplier)
                gameState.score += earnedPoints
                lastBrickHitTime = currentTime
                
                // Show combo notification if applicable
                if (scoreMultiplier > 1) {
                  notifications.push({ 
                    text: `COMBO x${Math.round(scoreMultiplier)}! +${earnedPoints}`, 
                    time: 90 
                  })
                }
                
                audioSystem.playBrickDestroyed()
                
                // Create particles
                for (let i = 0; i < 10; i++) {
                  particles.push({
                    x: brick.x + brickInfo.width / 2,
                    y: brick.y + brickInfo.height / 2,
                    radius: Math.random() * 2 + 1,
                    color: brickInfo.color[2],
                    dx: (Math.random() - 0.5) * 4,
                    dy: (Math.random() - 0.5) * 4,
                    life: 30
                  })
                }
                
                // Check for power-up drop
                const currentLevel = levelManager.getCurrentLevel()
                if (currentLevel && Math.random() < currentLevel.powerUpChance) {
                  dropPowerUp(brick.x, brick.y)
                }
              }
            } else {
              brick.status = 0
              
              // Calculate combo scoring for fire ball too
              const currentTime = performance.now()
              const timeSinceLastHit = lastBrickHitTime > 0 ? (currentTime - lastBrickHitTime) / 1000 : 999
              
              let scoreMultiplier = 1
              if (lastBrickHitTime > 0) {
                // Sliding scale: 0 seconds = 10x (1000 points), 5 seconds = 1x (100 points)
                if (timeSinceLastHit <= 5) {
                  // Smooth sliding scale from 10x to 1x over 5 seconds
                  const progress = (5 - timeSinceLastHit) / 5 // 0 to 1
                  scoreMultiplier = 1 + (9 * Math.pow(progress, 0.7)) // Exponential curve for more randomness
                } else {
                  scoreMultiplier = 1
                }
              }
              
              const baseScore = 100
              const earnedPoints = Math.round(baseScore * scoreMultiplier)
              gameState.score += earnedPoints
              lastBrickHitTime = currentTime
              
              if (scoreMultiplier > 1) {
                notifications.push({ 
                  text: `FIRE COMBO x${Math.round(scoreMultiplier)}! +${earnedPoints}`, 
                  time: 90 
                })
              }
            }

            // Check if level complete
            if (checkLevelComplete()) {
              const nextLevel = levelManager.nextLevel()
              if (nextLevel) {
                // Load next level
                createBricks()
                resetBallAndPaddle()
                gameState.level++
              } else {
                // Game won!
                gameState.gameWon = true
                gameState.gameOver = true
                audioSystem.playWin()
                highScoreStore.updateHighScore(gameState.score)
              }
            }
          }
        }
      }
    }

    // Ball and paddle
    if (
      ball.x > paddle.x &&
      ball.x < paddle.x + paddle.width &&
      ball.y + ball.radius > paddle.y
    ) {
      audioSystem.playPaddleHit()
      let collidePoint = ball.x - (paddle.x + paddle.width / 2)
      collidePoint = collidePoint / (paddle.width / 2)
      let angle = collidePoint * (Math.PI / 3)
      ball.dx = ball.speed * Math.sin(angle)
      ball.dy = -ball.speed * Math.cos(angle)

      if (gameState.stickyBall) {
        gameState.gameStarted = false
        ball.y = paddle.y - ball.radius
      }
    }

    // Ball and walls
    if (ball.x + ball.dx > CANVAS_WIDTH - ball.radius || ball.x + ball.dx < ball.radius) {
      ball.dx = -ball.dx
      audioSystem.playWallHit()
    }
    if (ball.y + ball.dy < ball.radius) {
      ball.dy = -ball.dy
      audioSystem.playWallHit()
    } else if (ball.y + ball.dy > CANVAS_HEIGHT - ball.radius) {
      gameState.lives--
      audioSystem.playLifeLost()
      if (gameState.lives <= 0) {
        gameState.gameOver = true
        audioSystem.playGameOver()
        highScoreStore.updateHighScore(gameState.score)
      } else {
        resetBallAndPaddle()
      }
    }
  }

  function checkLevelComplete(): boolean {
    for (let c = 0; c < bricks.length; c++) {
      for (let r = 0; r < bricks[c].length; r++) {
        const brick = bricks[c][r]
        if (brick && brick.status === 1) {
          return false
        }
      }
    }
    return true
  }

  function dropPowerUp(x: number, y: number) {
    const powerUpTypes = [
      { name: 'fire', color: '#f5a623' },
      { name: 'sticky', color: '#4a90e2' },
      { name: 'extraBall', color: '#7ed321' },
      { name: 'slowDown', color: '#d0021b' }
    ]
    const negativePowerUps = [
      { name: 'speedUp', color: '#bd10e0' },
      { name: 'clearGood', color: '#9013fe' }
    ]
    
    const type = Math.random() < 0.7 
      ? powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)]
      : negativePowerUps[Math.floor(Math.random() * negativePowerUps.length)]
    
    powerUps.push({ 
      x, 
      y, 
      type: type.name as any, 
      color: type.color, 
      dy: 2 
    })
  }

  function updatePowerUps() {
    const timeMultiplier = deltaTime / FRAME_TIME
    
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const powerUp = powerUps[i]
      powerUp.y += powerUp.dy * timeMultiplier

      // Check for collision with paddle
      if (
        powerUp.y > paddle.y &&
        powerUp.x > paddle.x &&
        powerUp.x < paddle.x + paddle.width
      ) {
        audioSystem.playPowerUp()
        activatePowerUp(powerUp.type)
        powerUps.splice(i, 1)
      }

      // Remove if it goes off-screen
      if (powerUp.y > CANVAS_HEIGHT) {
        powerUps.splice(i, 1)
      }
    }
  }

  function activatePowerUp(type: string) {
    notifications.push({ text: type.toUpperCase() + '!', time: 120 })
    
    switch (type) {
      case 'fire':
        gameState.fireBall = true
        setTimeout(() => gameState.fireBall = false, 10000)
        break
      case 'sticky':
        gameState.stickyBall = true
        setTimeout(() => gameState.stickyBall = false, 10000)
        break
      case 'extraBall':
        gameState.lives++
        break
      case 'slowDown':
        if (balls[0]) {
          balls[0].dx /= 2
          balls[0].dy /= 2
          setTimeout(() => {
            if (balls[0]) {
              balls[0].dx *= 2
              balls[0].dy *= 2
            }
          }, 10000)
        }
        break
      case 'speedUp':
        if (balls[0]) {
          balls[0].dx *= 2
          balls[0].dy *= 2
          setTimeout(() => {
            if (balls[0]) {
              balls[0].dx /= 2
              balls[0].dy /= 2
            }
          }, 10000)
        }
        break
      case 'clearGood':
        gameState.fireBall = false
        gameState.stickyBall = false
        break
    }
  }

  function updateParticles() {
    const timeMultiplier = deltaTime / FRAME_TIME
    
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i]
      particle.x += particle.dx * timeMultiplier
      particle.y += particle.dy * timeMultiplier
      particle.life -= timeMultiplier
      if (particle.life <= 0) {
        particles.splice(i, 1)
      }
    }
  }

  function updateNotifications() {
    const timeMultiplier = deltaTime / FRAME_TIME
    
    for (let i = notifications.length - 1; i >= 0; i--) {
      notifications[i].time -= timeMultiplier
      if (notifications[i].time <= 0) {
        notifications.splice(i, 1)
      }
    }
  }

  function resetBallAndPaddle() {
    gameState.gameStarted = false
    if (balls[0]) {
      balls[0].x = CANVAS_WIDTH / 2
      balls[0].y = CANVAS_HEIGHT - 30
      const currentLevel = levelManager.getCurrentLevel()
      if (currentLevel) {
        balls[0].dx = currentLevel.ballSpeed
        balls[0].dy = -currentLevel.ballSpeed
      }
    }
    paddle.x = (CANVAS_WIDTH - paddle.width) / 2
  }

  function restartGame() {
    // Reset game state
    gameState = {
      score: 0,
      lives: 5,
      level: 1,
      gameOver: false,
      gameStarted: false,
      gamePaused: false,
      initialStart: true,
      gameWon: false,
      stickyBall: false,
      fireBall: false
    }
    
    // Reset paddle
    paddle.x = CANVAS_WIDTH / 2 - 50
    paddle.dx = 0
    
    // Reset level
    levelManager.resetToFirstLevel()
    
    // Clear arrays
    balls = []
    powerUps = []
    particles = []
    notifications = []
    
    // Recreate game objects
    initGame()
  }

  function draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    drawBricks()
    drawPaddle()
    drawBalls()
    drawPowerUps()
    drawParticles()
    drawUI()
    drawNotifications()
    
    if (gameState.gameOver) {
      drawGameOver()
    } else if (gameState.initialStart) {
      drawStartScreen()
    }
  }

  function drawPaddle() {
    ctx.beginPath()
    
    const radius = paddle.height / 2
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height)
    gradient.addColorStop(0, '#888')
    gradient.addColorStop(1, '#fff')
    ctx.fillStyle = gradient
    
    // Draw rounded rectangle
    ctx.moveTo(paddle.x + radius, paddle.y)
    ctx.lineTo(paddle.x + paddle.width - radius, paddle.y)
    ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y, paddle.x + paddle.width, paddle.y + radius)
    ctx.lineTo(paddle.x + paddle.width, paddle.y + paddle.height - radius)
    ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y + paddle.height, paddle.x + paddle.width - radius, paddle.y + paddle.height)
    ctx.lineTo(paddle.x + radius, paddle.y + paddle.height)
    ctx.quadraticCurveTo(paddle.x, paddle.y + paddle.height, paddle.x, paddle.y + paddle.height - radius)
    ctx.lineTo(paddle.x, paddle.y + radius)
    ctx.quadraticCurveTo(paddle.x, paddle.y, paddle.x + radius, paddle.y)
    ctx.fill()
    ctx.closePath()
    
    // Add highlight
    ctx.beginPath()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.moveTo(paddle.x + radius, paddle.y)
    ctx.lineTo(paddle.x + paddle.width - radius, paddle.y)
    ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y, paddle.x + paddle.width, paddle.y + radius)
    ctx.lineTo(paddle.x + paddle.width, paddle.y + paddle.height / 2)
    ctx.lineTo(paddle.x, paddle.y + paddle.height / 2)
    ctx.lineTo(paddle.x, paddle.y + radius)
    ctx.quadraticCurveTo(paddle.x, paddle.y, paddle.x + radius, paddle.y)
    ctx.fill()
    ctx.closePath()
  }

  function drawBalls() {
    for (const ball of balls) {
      ctx.beginPath()
      const gradient = ctx.createRadialGradient(
        ball.x - ball.radius * 0.3, 
        ball.y - ball.radius * 0.3, 
        0, 
        ball.x, 
        ball.y, 
        ball.radius
      )
      
      const baseColor = gameState.fireBall ? '#f5a623' : ball.color
      gradient.addColorStop(0, '#fff')
      gradient.addColorStop(0.4, baseColor)
      gradient.addColorStop(0.8, '#666')
      gradient.addColorStop(1, '#333')
      
      ctx.fillStyle = gradient
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.closePath()
      
      // Add highlight
      ctx.beginPath()
      const highlightGradient = ctx.createRadialGradient(
        ball.x - ball.radius * 0.4,
        ball.y - ball.radius * 0.4,
        0,
        ball.x - ball.radius * 0.4,
        ball.y - ball.radius * 0.4,
        ball.radius * 0.6
      )
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      
      ctx.fillStyle = highlightGradient
      ctx.arc(ball.x, ball.y, ball.radius * 0.6, 0, Math.PI * 2)
      ctx.fill()
      ctx.closePath()
    }
  }

  function drawBricks() {
    for (let c = 0; c < bricks.length; c++) {
      for (let r = 0; r < bricks[c].length; r++) {
        const brick = bricks[c][r]
        if (brick && brick.status === 1) {
          ctx.beginPath()
          
          const startX = brick.x - brickInfo.width * 0.2
          const startY = brick.y - brickInfo.height * 0.2
          const endX = brick.x + brickInfo.width * 1.2
          const endY = brick.y + brickInfo.height * 1.2
          
          const gradient = ctx.createLinearGradient(startX, startY, endX, endY)
          const baseColor = brickInfo.color[brick.hits - 1]
          
          gradient.addColorStop(0, '#000')
          gradient.addColorStop(0.3, baseColor)
          gradient.addColorStop(0.7, '#fff')
          gradient.addColorStop(1, baseColor)
          
          ctx.fillStyle = gradient
          ctx.rect(brick.x, brick.y, brickInfo.width, brickInfo.height)
          ctx.fill()
          ctx.closePath()
          
          // Add highlight
          ctx.beginPath()
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
          ctx.lineWidth = 1
          ctx.moveTo(brick.x, brick.y)
          ctx.lineTo(brick.x + brickInfo.width * 0.3, brick.y)
          ctx.stroke()
          ctx.closePath()
        }
      }
    }
  }

  function drawPowerUps() {
    for (const powerUp of powerUps) {
      ctx.beginPath()
      ctx.rect(powerUp.x, powerUp.y, 10, 10)
      ctx.fillStyle = powerUp.color
      ctx.fill()
      ctx.closePath()
    }
  }

  function drawParticles() {
    for (const particle of particles) {
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
      ctx.fillStyle = particle.color
      ctx.fill()
      ctx.closePath()
    }
  }

  function drawUI() {
    ctx.font = '16px "Press Start 2P", monospace'
    ctx.fillStyle = '#fff'

    ctx.textAlign = 'left'
    ctx.fillText('Score: ' + gameState.score, 8, 20)
    ctx.fillText('Level: ' + levelManager.getCurrentLevelNumber(), 8, 40)

    ctx.textAlign = 'right'
    ctx.fillText('Lives: ' + gameState.lives, CANVAS_WIDTH - 8, 20)
    
    const currentLevel = levelManager.getCurrentLevel()
    if (currentLevel) {
      ctx.fillText(currentLevel.name, CANVAS_WIDTH - 8, 40)
    }
  }

  function drawNotifications() {
    ctx.font = '16px "Press Start 2P", monospace'
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    for (let i = 0; i < notifications.length; i++) {
      ctx.fillText(notifications[i].text, CANVAS_WIDTH / 2, 60 + i * 20)
    }
  }

  function drawGameOver() {
    ctx.font = '48px "Press Start 2P", monospace'
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    if (gameState.gameWon) {
      ctx.fillText('YOU WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
      ctx.font = '24px "Press Start 2P", monospace'
      ctx.fillText('Score: ' + gameState.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50)
      ctx.font = '16px "Press Start 2P", monospace'
      ctx.fillText('Click to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80)
    } else {
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
      ctx.font = '24px "Press Start 2P", monospace'
      ctx.fillText('Score: ' + gameState.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50)
      ctx.font = '16px "Press Start 2P", monospace'
      ctx.fillText('Click to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80)
    }
  }

  function drawStartScreen() {
    ctx.font = '24px "Press Start 2P", monospace'
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.fillText('Click or Space to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    
    const currentLevel = levelManager.getCurrentLevel()
    if (currentLevel) {
      ctx.font = '16px "Press Start 2P", monospace'
      ctx.fillText(`Level ${currentLevel.id}: ${currentLevel.name}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
    }
  }

  function gameLoop(currentTime: number = performance.now()) {
    if (lastTime === 0) {
      lastTime = currentTime
    }
    
    deltaTime = currentTime - lastTime
    lastTime = currentTime

    update()
    draw()
    animationId = requestAnimationFrame(gameLoop)
  }
</script>

<canvas 
  bind:this={canvas} 
  width={CANVAS_WIDTH} 
  height={CANVAS_HEIGHT}
  class="game-canvas"
></canvas>

<style>
  .game-canvas {
    background-color: #000;
    border: 4px solid #fff;
    max-width: 100%;
    max-height: 100vh;
    display: block;
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    .game-canvas {
      border-width: 2px;
    }
  }
</style> 