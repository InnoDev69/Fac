// Estado de la aplicación
const appState = {
  folders: [],
  documents: {},
  events: [],
  currentFolder: null,
  currentDocument: null,
  selectedDate: new Date(),
}

// Elementos DOM
const elements = {
  // Navegación
  sidebar: document.getElementById("sidebar"),
  toggleSidebar: document.getElementById("toggle-sidebar"),
  foldersList: document.getElementById("folders-list"),
  addFolder: document.getElementById("add-folder"),
  viewCalendar: document.getElementById("view-calendar"),

  // Vistas
  foldersView: document.getElementById("folders-view"),
  documentView: document.getElementById("document-view"),
  calendarView: document.getElementById("calendar-view"),

  // Vista de carpetas
  currentFolderName: document.getElementById("current-folder-name"),
  addDocument: document.getElementById("add-document"),
  documentsContainer: document.getElementById("documents-container"),

  // Vista de documento
  backToFolder: document.getElementById("back-to-folder"),
  currentDocumentName: document.getElementById("current-document-name"),
  saveDocument: document.getElementById("save-document"),
  documentTitle: document.getElementById("document-title"),
  documentContent: document.getElementById("document-content"),

  // Vista de calendario
  backToMain: document.getElementById("back-to-main"),
  addEvent: document.getElementById("add-event"),
  prevMonth: document.getElementById("prev-month"),
  nextMonth: document.getElementById("next-month"),
  currentMonth: document.getElementById("current-month"),
  calendarGrid: document.getElementById("calendar-grid"),
  eventsContainer: document.getElementById("events-container"),

  // Modales
  folderModal: document.getElementById("folder-modal"),
  folderName: document.getElementById("folder-name"),
  cancelFolder: document.getElementById("cancel-folder"),
  createFolder: document.getElementById("create-folder"),

  eventModal: document.getElementById("event-modal"),
  eventTitle: document.getElementById("event-title"),
  eventDate: document.getElementById("event-date"),
  eventDescription: document.getElementById("event-description"),
  cancelEvent: document.getElementById("cancel-event"),
  createEvent: document.getElementById("create-event"),
}

// Funciones de utilidad
function showView(viewId) {
  document.querySelectorAll(".content-view").forEach((view) => {
    view.classList.remove("active")
  })
  document.getElementById(viewId).classList.add("active")
}

function formatDate(date) {
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function showModal(modalId) {
  document.getElementById(modalId).classList.add("active")
}

function hideModal(modalId) {
  document.getElementById(modalId).classList.remove("active")
}

// Funciones para manejar carpetas
function createFolder(name) {
  const folderId = Date.now().toString()
  const newFolder = {
    id: folderId,
    name: name,
    createdAt: new Date(),
  }

  appState.folders.push(newFolder)
  appState.documents[folderId] = []
  saveData()
  renderFolders()
}

function renderFolders() {
  elements.foldersList.innerHTML = ""

  appState.folders.forEach((folder) => {
    const li = document.createElement("li")
    li.textContent = folder.name
    li.dataset.id = folder.id

    if (appState.currentFolder && appState.currentFolder.id === folder.id) {
      li.classList.add("active")
    }

    li.addEventListener("click", () => {
      appState.currentFolder = folder
      renderDocuments()
      showView("folders-view")
      elements.currentFolderName.textContent = folder.name

      // Actualizar clase activa
      document.querySelectorAll("#folders-list li").forEach((item) => {
        item.classList.remove("active")
      })
      li.classList.add("active")
    })

    elements.foldersList.appendChild(li)
  })
}

// Funciones para manejar documentos
function createDocument(folderId, title = "Nuevo documento") {
  const documentId = Date.now().toString()
  const newDocument = {
    id: documentId,
    title: title,
    content: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  appState.documents[folderId].push(newDocument)
  saveData()
  renderDocuments()
  return newDocument
}

function renderDocuments() {
  if (!appState.currentFolder) return

  const folderId = appState.currentFolder.id
  elements.documentsContainer.innerHTML = ""

  if (!appState.documents[folderId] || appState.documents[folderId].length === 0) {
    const emptyMessage = document.createElement("div")
    emptyMessage.className = "empty-message"
    emptyMessage.textContent = "No hay documentos en esta carpeta. Crea uno nuevo."
    elements.documentsContainer.appendChild(emptyMessage)
    return
  }

  appState.documents[folderId].forEach((doc) => {
    const card = document.createElement("div")
    card.className = "document-card"
    card.dataset.id = doc.id

    const title = document.createElement("h3")
    title.textContent = doc.title

    const preview = document.createElement("p")
    // Extraer texto plano del contenido HTML
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = doc.content
    preview.textContent = tempDiv.textContent || "Sin contenido"

    const date = document.createElement("small")
    date.textContent = formatDate(new Date(doc.updatedAt))

    card.appendChild(title)
    card.appendChild(preview)
    card.appendChild(date)

    card.addEventListener("click", () => {
      openDocument(doc)
    })

    elements.documentsContainer.appendChild(card)
  })
}

function openDocument(document) {
  appState.currentDocument = document
  elements.documentTitle.value = document.title
  elements.documentContent.innerHTML = document.content
  elements.currentDocumentName.textContent = document.title
  showView("document-view")
}

function saveDocument() {
  if (!appState.currentDocument || !appState.currentFolder) return

  const folderId = appState.currentFolder.id
  const docId = appState.currentDocument.id
  const docIndex = appState.documents[folderId].findIndex((doc) => doc.id === docId)

  if (docIndex === -1) return

  appState.documents[folderId][docIndex].title = elements.documentTitle.value
  appState.documents[folderId][docIndex].content = elements.documentContent.innerHTML
  appState.documents[folderId][docIndex].updatedAt = new Date()

  saveData()

  // Actualizar nombre en la interfaz
  elements.currentDocumentName.textContent = elements.documentTitle.value

  // Mostrar notificación
  alert("Documento guardado correctamente")
}

// Funciones para manejar eventos del calendario
function createEvent(title, date, description) {
  const eventId = Date.now().toString()
  const newEvent = {
    id: eventId,
    title: title,
    date: new Date(date),
    description: description,
  }

  appState.events.push(newEvent)
  saveData()
  renderCalendar()
  renderEvents()
}

function renderCalendar() {
  const currentDate = appState.selectedDate
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Actualizar encabezado del mes
  elements.currentMonth.textContent = currentDate.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  })

  // Limpiar grid
  elements.calendarGrid.innerHTML = ""

  // Agregar días de la semana
  const weekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
  weekdays.forEach((day) => {
    const dayElement = document.createElement("div")
    dayElement.className = "calendar-weekday"
    dayElement.textContent = day
    elements.calendarGrid.appendChild(dayElement)
  })

  // Obtener el primer día del mes
  const firstDay = new Date(year, month, 1)
  const startingDay = firstDay.getDay() // 0 = Domingo, 1 = Lunes, etc.

  // Obtener el último día del mes
  const lastDay = new Date(year, month + 1, 0)
  const totalDays = lastDay.getDate()

  // Agregar días vacíos para alinear con el día de la semana
  for (let i = 0; i < startingDay; i++) {
    const emptyDay = document.createElement("div")
    emptyDay.className = "calendar-day empty"
    elements.calendarGrid.appendChild(emptyDay)
  }

  // Agregar días del mes
  const today = new Date()
  for (let i = 1; i <= totalDays; i++) {
    const dayElement = document.createElement("div")
    dayElement.className = "calendar-day"
    dayElement.textContent = i

    const currentDateCheck = new Date(year, month, i)

    // Verificar si es hoy
    if (today.getDate() === i && today.getMonth() === month && today.getFullYear() === year) {
      dayElement.classList.add("today")
    }

    // Verificar si es el día seleccionado
    if (
      appState.selectedDate.getDate() === i &&
      appState.selectedDate.getMonth() === month &&
      appState.selectedDate.getFullYear() === year
    ) {
      dayElement.classList.add("selected")
    }

    // Verificar si hay eventos en este día
    const hasEvents = appState.events.some((event) => {
      const eventDate = new Date(event.date)
      return eventDate.getDate() === i && eventDate.getMonth() === month && eventDate.getFullYear() === year
    })

    if (hasEvents) {
      dayElement.classList.add("has-event")
    }

    // Agregar evento de clic
    dayElement.addEventListener("click", () => {
      appState.selectedDate = new Date(year, month, i)
      renderCalendar()
      renderEvents()
    })

    elements.calendarGrid.appendChild(dayElement)
  }
}

function renderEvents() {
  elements.eventsContainer.innerHTML = ""

  const selectedDate = appState.selectedDate
  const eventsForDay = appState.events.filter((event) => {
    const eventDate = new Date(event.date)
    return (
      eventDate.getDate() === selectedDate.getDate() &&
      eventDate.getMonth() === selectedDate.getMonth() &&
      eventDate.getFullYear() === selectedDate.getFullYear()
    )
  })

  if (eventsForDay.length === 0) {
    const emptyMessage = document.createElement("p")
    emptyMessage.textContent = "No hay eventos para este día"
    elements.eventsContainer.appendChild(emptyMessage)
    return
  }

  eventsForDay.forEach((event) => {
    const eventElement = document.createElement("div")
    eventElement.className = "event-item"

    const title = document.createElement("h4")
    title.textContent = event.title

    const date = document.createElement("div")
    date.className = "event-date"
    date.textContent = formatDate(new Date(event.date))

    const description = document.createElement("p")
    description.textContent = event.description

    const deleteBtn = document.createElement("button")
    deleteBtn.className = "btn-secondary"
    deleteBtn.textContent = "Eliminar"
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      deleteEvent(event.id)
    })

    eventElement.appendChild(title)
    eventElement.appendChild(date)
    eventElement.appendChild(description)
    eventElement.appendChild(deleteBtn)

    elements.eventsContainer.appendChild(eventElement)
  })
}

function deleteEvent(eventId) {
  const confirmDelete = confirm("¿Estás seguro de que deseas eliminar este evento?")
  if (!confirmDelete) return

  const eventIndex = appState.events.findIndex((event) => event.id === eventId)
  if (eventIndex === -1) return

  appState.events.splice(eventIndex, 1)
  saveData()
  renderCalendar()
  renderEvents()
}

// Funciones para manejar el editor de texto
function setupEditor() {
  const toolbar = document.querySelector(".editor-toolbar")

  toolbar.addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON") return

    const action = e.target.dataset.action

    switch (action) {
      case "bold":
        document.execCommand("bold", false, null)
        break
      case "italic":
        document.execCommand("italic", false, null)
        break
      case "underline":
        document.execCommand("underline", false, null)
        break
      case "heading":
        document.execCommand("formatBlock", false, "<h2>")
        break
      case "list":
        document.execCommand("insertUnorderedList", false, null)
        break
    }

    // Mantener el foco en el editor
    elements.documentContent.focus()
  })
}

// Persistencia de datos
function saveData() {
  const data = {
    folders: appState.folders,
    documents: appState.documents,
    events: appState.events,
  }

  localStorage.setItem("carpetaDigital", JSON.stringify(data))

  // También enviar al backend
  sendDataToBackend(data)
}

function loadData() {
  // Primero intentar cargar desde el backend
  fetchDataFromBackend()
    .then((data) => {
      if (data) {
        initializeAppState(data)
      } else {
        // Si no hay datos en el backend, intentar cargar desde localStorage
        const savedData = localStorage.getItem("carpetaDigital")
        if (savedData) {
          initializeAppState(JSON.parse(savedData))
        } else {
          // Si no hay datos guardados, crear una carpeta por defecto
          createFolder("Mis Documentos")
        }
      }
    })
    .catch((error) => {
      console.error("Error al cargar datos del backend:", error)
      // Intentar cargar desde localStorage como respaldo
      const savedData = localStorage.getItem("carpetaDigital")
      if (savedData) {
        initializeAppState(JSON.parse(savedData))
      } else {
        // Si no hay datos guardados, crear una carpeta por defecto
        createFolder("Mis Documentos")
      }
    })
}

function initializeAppState(data) {
  appState.folders = data.folders || []
  appState.documents = data.documents || {}
  appState.events = data.events || []

  // Convertir fechas de string a objetos Date
  appState.events.forEach((event) => {
    event.date = new Date(event.date)
  })

  // Establecer carpeta actual si hay carpetas
  if (appState.folders.length > 0) {
    appState.currentFolder = appState.folders[0]
  }

  // Renderizar interfaz
  renderFolders()
  renderDocuments()
  renderCalendar()
  renderEvents()
}

// Comunicación con el backend
async function sendDataToBackend(data) {
  try {
    const response = await fetch("/api/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error("Error al guardar datos en el servidor")
    }
  } catch (error) {
    console.error("Error al enviar datos al backend:", error)
    // Continuar usando localStorage como respaldo
  }
}

async function fetchDataFromBackend() {
  try {
    const response = await fetch("/api/load")

    if (!response.ok) {
      throw new Error("Error al cargar datos del servidor")
    }

    return await response.json()
  } catch (error) {
    console.error("Error al obtener datos del backend:", error)
    return null
  }
}

// Event Listeners
function setupEventListeners() {
  // Navegación
  elements.toggleSidebar.addEventListener("click", () => {
    elements.sidebar.classList.toggle("active")
  })

  elements.viewCalendar.addEventListener("click", () => {
    showView("calendar-view")
    renderCalendar()
    renderEvents()
  })

  // Carpetas
  elements.addFolder.addEventListener("click", () => {
    showModal("folder-modal")
  })

  elements.createFolder.addEventListener("click", () => {
    const folderName = elements.folderName.value.trim()
    if (folderName) {
      createFolder(folderName)
      hideModal("folder-modal")
      elements.folderName.value = ""
    }
  })

  elements.cancelFolder.addEventListener("click", () => {
    hideModal("folder-modal")
    elements.folderName.value = ""
  })

  // Documentos
  elements.addDocument.addEventListener("click", () => {
    if (!appState.currentFolder) return

    const newDoc = createDocument(appState.currentFolder.id)
    openDocument(newDoc)
  })

  elements.backToFolder.addEventListener("click", () => {
    showView("folders-view")
  })

  elements.saveDocument.addEventListener("click", saveDocument)

  // Calendario
  elements.backToMain.addEventListener("click", () => {
    showView("folders-view")
  })

  elements.prevMonth.addEventListener("click", () => {
    const currentDate = appState.selectedDate
    appState.selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    renderCalendar()
    renderEvents()
  })

  elements.nextMonth.addEventListener("click", () => {
    const currentDate = appState.selectedDate
    appState.selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    renderCalendar()
    renderEvents()
  })

  elements.addEvent.addEventListener("click", () => {
    // Establecer la fecha actual en el input de fecha
    const today = appState.selectedDate.toISOString().split("T")[0]
    elements.eventDate.value = today
    showModal("event-modal")
  })

  elements.createEvent.addEventListener("click", () => {
    const title = elements.eventTitle.value.trim()
    const date = elements.eventDate.value
    const description = elements.eventDescription.value.trim()

    if (title && date) {
      createEvent(title, date, description)
      hideModal("event-modal")
      elements.eventTitle.value = ""
      elements.eventDescription.value = ""
    }
  })

  elements.cancelEvent.addEventListener("click", () => {
    hideModal("event-modal")
    elements.eventTitle.value = ""
    elements.eventDescription.value = ""
  })
}

// Inicialización
function init() {
  setupEventListeners()
  setupEditor()
  loadData()
  showView("folders-view")
}

// Iniciar la aplicación
document.addEventListener("DOMContentLoaded", init)

