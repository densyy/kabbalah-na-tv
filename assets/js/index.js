/* ---- Envs ---- */

const BASE_URL = 'https://kabbalahmedia.info/backend'
let lessons = []

/* ---- OnMount ---- */

main()

/* ---- Functions ---- */

async function main () {
  await getLessons()
  stopLoading()
}

function stopLoading () {
  setTimeout(() => {
    const loading = document.getElementById('loading')
    if (loading) loading.style.display = 'none'
  }, 500)
}

async function getLessons () {
  try {
    const response = await fetch(`${BASE_URL}/lessons?page_no=1&page_size=10&withViews=true&content_type=DAILY_LESSON&ui_language=pt&content_languages=pt`)
    lessons = await response.json()
  } catch (error) {
    console.log('Error fetching lessons:', error)
  }
}
