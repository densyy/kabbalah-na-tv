/* ---- Envs ---- */

const BASE_URL = 'https://kabbalahmedia.info/backend'
let lessons = []
let collections = []
let groupedLessons = []
let currentRowIndex = 0
let currentCardIndex = 0

window.closeVideoPlayer = closeVideoPlayer
window.handlePartClick = handlePartClick
window.closeErrorAlert = closeErrorAlert

/* ---- OnMount ---- */

main()

/* ---- Functions ---- */

async function main () {
  await getLessons()
  await getCollectionsFromLessons()
  groupLessons()
  renderLessons()
  setupLazyLoading()
  setupTVNavigation()
  stopLoading()
}

function stopLoading () {
  setTimeout(() => {
    const loading = document.getElementById('loading')
    const app = document.getElementById('app')

    if (loading) loading.style.display = 'none'
    if (app) app.classList.remove('hidden')

    focusCurrentCard()
  }, 100)
}

async function getLessons () {
  try {
    const response = await fetch(`${BASE_URL}/lessons?page_no=1&page_size=56&withViews=true&content_type=DAILY_LESSON&ui_language=pt&content_languages=pt`)
    lessons = await response.json()
  } catch (error) {
    showErrorAlert('Erro ao carregar as aulas. Verifique sua conexão e tente novamente.')
  }
}

async function getCollectionsFromLessons () {
  const ids = lessons?.items?.map(item => item.id)
  if (ids.length === 0) return

  const idParams = ids.map(id => `id=${id}`).join('&')
  const url = `${BASE_URL}/collections?page_size=5&${idParams}&ui_language=pt&content_languages=pt`

  try {
    const response = await fetch(url)
    collections = await response.json()
  } catch (error) {
    showErrorAlert('Erro ao carregar os grupos de aulas. Verifique sua conexão e tente novamente.')
  }
}

function groupLessons () {
  collections.collections.forEach(c => {
    const idLesson = c.id
    if (!groupedLessons[idLesson]) groupedLessons[idLesson] = []

    c.content_units.forEach(u => {
      const duration = formatDuration(u.duration)
      const date = new Date(u.film_date + 'T00:00:00').toLocaleDateString('pt-BR')
      const title = u.name
      const idPart = u.id
      const thumbnail = `https://kabbalahmedia.info/imaginary/thumbnail?url=http://nginx/assets/api/thumbnail/${u.id}&width=400&stripmeta=true`

      groupedLessons[idLesson].push({ duration, date, title, thumbnail, idLesson, idPart })
    })
  })
}

function formatDuration (seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  let duration = ''
  if (hours > 0) duration += `${hours} hora${hours !== 1 ? 's' : ''} e `
  duration += `${minutes} minuto${minutes !== 1 ? 's' : ''}`

  return duration
}

async function loadVideo (id) {
  const videoPlayer = document.getElementById('video-player')
  const videoElement = document.getElementById('video-element')
  const videoLoading = document.getElementById('video-loading')

  videoPlayer.classList.remove('hidden')
  videoLoading.classList.remove('hidden')
  videoElement.style.opacity = '0'
  document.body.classList.add('no-scroll')

  try {
    const url = `${BASE_URL}/content_units?page_size=1&id=${id}&with_files=true&ui_language=pt&content_languages=pt`
    const response = await fetch(url)
    const data = await response.json()

    const unit = data.content_units[0]
    const ptVideo = unit.files.find(file => file.language === 'pt' && file.type === 'video')

    if (ptVideo) {
      const videoSrc = `https://cdn.kabbalahmedia.info/${ptVideo.id}.mp4`
      videoElement.src = videoSrc
      videoElement.load()

      videoElement.oncanplay = () => {
        videoLoading.classList.add('hidden')
        videoElement.style.opacity = '1'
      }
    } else {
      showErrorAlert('Vídeo em português não encontrado para esta aula.')
      closeVideoPlayer()
    }
  } catch (error) {
    showErrorAlert('Erro ao carregar o vídeo. Tente novamente mais tarde.')
    closeVideoPlayer()
  }
}

function closeVideoPlayer () {
  const videoPlayer = document.getElementById('video-player')
  const videoElement = document.getElementById('video-element')

  videoElement.pause()
  videoElement.src = ''
  videoPlayer.classList.add('hidden')
  document.body.classList.remove('no-scroll')
}

function showErrorAlert (message) {
  const errorAlert = document.getElementById('error-alert')
  const errorMessage = document.getElementById('error-alert-message')

  errorMessage.textContent = message
  errorAlert.classList.remove('hidden')
  document.body.classList.add('no-scroll')
}

function closeErrorAlert () {
  const errorAlert = document.getElementById('error-alert')

  errorAlert.classList.add('hidden')
  document.body.classList.remove('no-scroll')
}

/* ---- Render Functions (Pure) ---- */

function renderLessons () {
  const container = document.getElementById('lessons-container')
  const html = createLessonsHTML(groupedLessons)
  container.innerHTML = html
}

function createLessonsHTML (groupedLessons) {
  return Object.keys(groupedLessons)
    .map(idLesson => createLessonRowHTML(idLesson, groupedLessons[idLesson]))
    .join('')
}

function createLessonRowHTML (idLesson, parts) {
  const firstPart = parts[0]
  const lessonDate = firstPart ? firstPart.date : ''
  const partsCount = parts.length

  return `
    <article class="lesson-row" data-lesson-id="${idLesson}">
      <header class="lesson-header">
        <h2 class="lesson-date">Aula de ${lessonDate}</h2>
        <span class="lesson-badge">${partsCount} parte${partsCount !== 1 ? 's' : ''}</span>
      </header>
      <div class="parts-container">
        ${parts.map((part, index) => createPartCardHTML(part, index + 1)).join('')}
      </div>
    </article>
  `
}

function createPartCardHTML (part, partNumber) {
  return `
    <div class="part-card" tabindex="0" data-lesson-id="${part.idLesson}" data-part-id="${part.idPart}" onclick="handlePartClick('${part.idPart}')">
      <div class="part-card-thumbnail" data-thumbnail="${part.thumbnail}">
        <span class="part-number">Parte ${partNumber}</span>
      </div>
      <div class="part-card-content">
        <h3 class="part-card-title">${part.title}</h3>
        <div class="part-card-meta">
          <span class="part-card-duration">${part.duration}</span>
          <span class="part-card-date">${part.date}</span>
        </div>
      </div>
    </div>
  `
}

function handlePartClick (idPart) {
  loadVideo(idPart)
}

/* ---- TV Navigation ---- */

function setupTVNavigation () {
  document.addEventListener('keydown', handleKeyNavigation)
}

function handleKeyNavigation (event) {
  const videoPlayer = document.getElementById('video-player')
  const errorAlert = document.getElementById('error-alert')

  // Se o video player ou alerta estiver aberto, não navegar
  if (!videoPlayer.classList.contains('hidden')) {
    if (event.key === 'Escape' || event.key === 'Backspace') closeVideoPlayer()
    return
  }

  if (!errorAlert.classList.contains('hidden')) {
    if (event.key === 'Enter' || event.key === 'Escape' || event.key === 'Backspace') closeErrorAlert()
    return
  }

  const rows = document.querySelectorAll('.lesson-row')
  if (rows.length === 0) return

  switch (event.key) {
    case 'ArrowRight':
      event.preventDefault()
      navigateRight(rows)
      break
    case 'ArrowLeft':
      event.preventDefault()
      navigateLeft(rows)
      break
    case 'ArrowDown':
      event.preventDefault()
      navigateDown(rows)
      break
    case 'ArrowUp':
      event.preventDefault()
      navigateUp(rows)
      break
    case 'Enter':
      event.preventDefault()
      selectCurrentCard()
      break
  }
}

function navigateRight (rows) {
  const currentRow = rows[currentRowIndex]
  const cards = currentRow.querySelectorAll('.part-card')

  if (currentCardIndex < cards.length - 1) {
    currentCardIndex++
    focusCurrentCard()
  }
}

function navigateLeft (_rows) {
  if (currentCardIndex > 0) {
    currentCardIndex--
    focusCurrentCard()
  }
}

function navigateDown (rows) {
  if (currentRowIndex < rows.length - 1) {
    currentRowIndex++
    const newRow = rows[currentRowIndex]
    const cards = newRow.querySelectorAll('.part-card')
    currentCardIndex = Math.min(currentCardIndex, cards.length - 1)
    focusCurrentCard()
  }
}

function navigateUp (rows) {
  if (currentRowIndex > 0) {
    currentRowIndex--
    const newRow = rows[currentRowIndex]
    const cards = newRow.querySelectorAll('.part-card')
    currentCardIndex = Math.min(currentCardIndex, cards.length - 1)
    focusCurrentCard()
  }
}

function focusCurrentCard () {
  const rows = document.querySelectorAll('.lesson-row')
  if (rows.length === 0) return

  const currentRow = rows[currentRowIndex]
  if (!currentRow) return

  const cards = currentRow.querySelectorAll('.part-card')
  if (cards.length === 0) return

  const card = cards[currentCardIndex]
  if (card) {
    card.focus()
    card.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
  }
}

function selectCurrentCard () {
  const rows = document.querySelectorAll('.lesson-row')
  if (rows.length === 0) return

  const currentRow = rows[currentRowIndex]
  const cards = currentRow.querySelectorAll('.part-card')
  const card = cards[currentCardIndex]

  if (card) {
    const idPart = card.dataset.partId
    handlePartClick(idPart)
  }
}

/* ---- Lazy Loading for Thumbnails ---- */

function setupLazyLoading () {
  const thumbnails = document.querySelectorAll('.part-card-thumbnail[data-thumbnail]')

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const thumbnail = entry.target
          const imageUrl = thumbnail.dataset.thumbnail

          if (imageUrl) {
            thumbnail.style.backgroundImage = `url('${imageUrl}')`
            thumbnail.style.backgroundSize = 'cover'
            thumbnail.style.backgroundPosition = 'center'
            thumbnail.removeAttribute('data-thumbnail')
          }

          observer.unobserve(thumbnail)
        }
      })
    }, {
      rootMargin: '50px 0px'
    })

    thumbnails.forEach(thumbnail => {
      imageObserver.observe(thumbnail)
    })
  } else {
    // Fallback para navegadores sem IntersectionObserver
    thumbnails.forEach(thumbnail => {
      const imageUrl = thumbnail.dataset.thumbnail
      if (imageUrl) {
        thumbnail.style.backgroundImage = `url('${imageUrl}')`
        thumbnail.style.backgroundSize = 'cover'
        thumbnail.style.backgroundPosition = 'center'
      }
    })
  }
}
