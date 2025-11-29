/* ---- OnMount ---- */

loading()

/* ---- Functions ---- */

function loading () {
  setTimeout(() => {
    const loading = document.getElementById('loading')
    if (loading) loading.style.display = 'none'
  }, 5000)
}
