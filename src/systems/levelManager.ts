import type { LevelData } from '../types/game'

class LevelManager {
  private levels: LevelData[] = []
  private currentLevelIndex = 0

  async loadLevels(): Promise<void> {
    // In a real implementation, we could dynamically discover levels
    // For now, we'll load the levels we know exist
    const levelFiles = [
      'level1.json', 'level2.json', 'level3.json', 'level4.json', 
      'level5.json', 'level6.json', 'level7.json', 'level8.json',
      'level9.json', 'level10.json'
    ]
    
    for (const file of levelFiles) {
      try {
        const response = await fetch(`./levels/${file}`)
        if (response.ok) {
          const levelData: LevelData = await response.json()
          this.levels.push(levelData)
        }
      } catch (error) {
        console.warn(`Failed to load level file: ${file}`, error)
      }
    }
    
    // Sort levels by ID to ensure proper order
    this.levels.sort((a, b) => a.id - b.id)
  }

  getCurrentLevel(): LevelData | null {
    return this.levels[this.currentLevelIndex] || null
  }

  getLevel(levelId: number): LevelData | null {
    return this.levels.find(level => level.id === levelId) || null
  }

  nextLevel(): LevelData | null {
    if (this.currentLevelIndex < this.levels.length - 1) {
      this.currentLevelIndex++
      return this.getCurrentLevel()
    }
    return null
  }

  previousLevel(): LevelData | null {
    if (this.currentLevelIndex > 0) {
      this.currentLevelIndex--
      return this.getCurrentLevel()
    }
    return null
  }

  setLevel(levelId: number): boolean {
    const levelIndex = this.levels.findIndex(level => level.id === levelId)
    if (levelIndex !== -1) {
      this.currentLevelIndex = levelIndex
      return true
    }
    return false
  }

  jumpToLevel(levelId: number): boolean {
    return this.setLevel(levelId)
  }

  resetToFirstLevel(): void {
    this.currentLevelIndex = 0
  }

  isLastLevel(): boolean {
    return this.currentLevelIndex === this.levels.length - 1
  }

  isFirstLevel(): boolean {
    return this.currentLevelIndex === 0
  }

  getTotalLevels(): number {
    return this.levels.length
  }

  getCurrentLevelNumber(): number {
    return this.currentLevelIndex + 1
  }

  getAllLevels(): LevelData[] {
    return [...this.levels]
  }
}

export const levelManager = new LevelManager() 