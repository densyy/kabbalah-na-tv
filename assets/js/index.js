/* ---- Envs ---- */

const BASE_URL = 'https://kabbalahmedia.info/backend'
let lessons = []
let collections = []

/* ---- OnMount ---- */

main()

/* ---- Functions ---- */

async function main () {
  await getLessons()
  await getCollectionsFromLessons()
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
    const response = await fetch(`${BASE_URL}/lessons?page_no=1&page_size=6&withViews=true&content_type=DAILY_LESSON&ui_language=pt&content_languages=pt`)
    lessons = await response.json()
  } catch (error) {
    console.log('Error fetching lessons:', error)
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
    console.log('Error fetching collections:', error)
  }
}
