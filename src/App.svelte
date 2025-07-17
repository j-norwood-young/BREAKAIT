<script lang="ts">
  import Game from './components/Game.svelte'
  import { onMount } from 'svelte'
  import { highScoreStore } from './stores/highScore'

  onMount(() => {
    // Initialize audio context on user interaction
    document.addEventListener('click', initAudioOnInteraction)
    document.addEventListener('touchstart', initAudioOnInteraction)
    document.addEventListener('keydown', initAudioOnInteraction)
  })

  function initAudioOnInteraction() {
    // This will be handled by the audio system
  }
</script>

<main>
  <h1>BREAKAIT</h1>
  <div class="high-score">
    High Score: {$highScoreStore}
  </div>
  <Game />
</main>

<style>
  :global(body) {
    background-color: #000;
    color: #fff;
    font-family: 'Press Start 2P', cursive;
    text-align: center;
    margin: 0;
    padding: 10px;
    overflow: hidden;
    touch-action: none;
  }

  main {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  h1 {
    margin: 10px 0;
    font-size: 24px;
    color: #fff;
  }

  .high-score {
    margin-bottom: 10px;
    font-size: 12px;
    color: #ccc;
  }

  :global(*) {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 18px;
      margin: 5px 0;
    }
  }
</style> 