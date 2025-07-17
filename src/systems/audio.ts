class AudioSystem {
  private audioContext: AudioContext | null = null
  private sounds: Record<string, () => void> = {}
  private initialized = false

  constructor() {
    this.initAudio()
  }

  private initAudio(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      // Resume audio context if it's suspended (mobile browsers)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }
      this.createSounds()
      this.initialized = true
    } catch (e) {
      console.warn('Audio not supported:', e)
    }
  }

  private createSounds(): void {
    if (!this.audioContext) return

    // Paddle hit sound
    this.sounds.paddleHit = this.createTone(200, 0.1, 'sine')
    
    // Brick hit sound
    this.sounds.brickHit = this.createTone(400, 0.15, 'square')
    
    // Brick destroyed sound
    this.sounds.brickDestroyed = this.createTone(600, 0.2, 'sawtooth')
    
    // Wall hit sound
    this.sounds.wallHit = this.createTone(300, 0.1, 'triangle')
    
    // Life lost sound
    this.sounds.lifeLost = this.createTone(150, 0.3, 'sawtooth')
    
    // Power-up sound
    this.sounds.powerUp = this.createTone(600, 0.2, 'sine')
    
    // Game over sound
    this.sounds.gameOver = this.createTone(100, 0.5, 'sawtooth')
    
    // Win sound
    this.sounds.win = this.createTone(800, 0.3, 'sine')
  }

  private createTone(frequency: number, duration: number, type: OscillatorType): () => void {
    return (): void => {
      if (!this.audioContext) return
      
      try {
        // Resume audio context if suspended (mobile browsers)
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume()
        }
        
        const oscillator = this.audioContext.createOscillator()
        const gainNode = this.audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(this.audioContext.destination)
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
        oscillator.type = type
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)
        
        oscillator.start(this.audioContext.currentTime)
        oscillator.stop(this.audioContext.currentTime + duration)
      } catch (e) {
        // Silently fail if audio context is not ready
        console.warn('Audio not ready:', e)
      }
    }
  }

  public initAudioOnInteraction(): void {
    if (!this.initialized) {
      this.initAudio()
    }
  }

  public play(soundName: string): void {
    if (this.sounds[soundName]) {
      this.sounds[soundName]()
    }
  }

  // Convenience methods for common sounds
  public playPaddleHit(): void { this.play('paddleHit') }
  public playBrickHit(): void { this.play('brickHit') }
  public playBrickDestroyed(): void { this.play('brickDestroyed') }
  public playWallHit(): void { this.play('wallHit') }
  public playLifeLost(): void { this.play('lifeLost') }
  public playPowerUp(): void { this.play('powerUp') }
  public playGameOver(): void { this.play('gameOver') }
  public playWin(): void { this.play('win') }
}

export const audioSystem = new AudioSystem() 