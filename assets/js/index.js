/* ---- Envs ---- */

const BASE_URL = 'https://kabbalahmedia.info/backend'
let lessons = []
let collections = []
let groupedLessons = []

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
  stopLoading()
}

function stopLoading () {
  setTimeout(() => {
    const loading = document.getElementById('loading')
    const app = document.getElementById('app')

    if (loading) loading.style.display = 'none'
    if (app) app.classList.remove('hidden')
  }, 500)
}

async function getLessons () {
  try {
    const response = await fetch(`${BASE_URL}/lessons?page_no=1&page_size=6&withViews=true&content_type=DAILY_LESSON&ui_language=pt&content_languages=pt`)
    lessons = await response.json()
  } catch (error) {
    showErrorAlert('Erro ao carregar as aulas. Verifique sua conexão e tente novamente.')
  }
}

async function getCollectionsFromLessons () {
  const ids = lessons?.items?.map(item => item.id)
  if (ids.length === 0) return

  const idParams = ids.map(id => `id=${id}`).join('&')
  const url = `${BASE_URL}/collections?page_size=6&${idParams}&ui_language=pt&content_languages=pt`

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
      const date = new Date(u.film_date).toLocaleDateString('pt-BR')
      const title = u.name
      const idPart = u.id

      groupedLessons[idLesson].push({ duration, date, title, idLesson, idPart })
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
      <div class="part-card-thumbnail">
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
