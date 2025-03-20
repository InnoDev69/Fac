document.addEventListener("DOMContentLoaded", () => {
  // Referencias a elementos del DOM
  const sidebar = document.getElementById("sidebar")
  const openSidebarBtn = document.getElementById("open-sidebar")
  const closeSidebarBtn = document.getElementById("close-sidebar")
  const contentContainer = document.getElementById("content-container")
  const pageTitle = document.getElementById("page-title")
  const navItems = document.querySelectorAll(".nav-item")
  const loadingSpinner = document.getElementById("loading-spinner")

  // Estado de la aplicación
  let currentView = "documents"

  // Función para cargar una vista
  async function loadView(view) {
    if (view === currentView) return

    currentView = view

    // Actualizar navegación
    navItems.forEach((item) => {
      if (item.dataset.view === view) {
        item.classList.add("active")
      } else {
        item.classList.remove("active")
      }
    })

    // Actualizar título
    const titles = {
      documents: "Documentos",
      calendar: "Calendario",
      notes: "Anotaciones",
    }
    pageTitle.textContent = titles[view]

    // Mostrar spinner de carga
    loadingSpinner.style.display = "flex"
    contentContainer.innerHTML = ""

    try {
      // Cargar la vista desde el servidor
      const response = await fetch(`/${view}`)
      const html = await response.text()

      // Ocultar spinner y mostrar contenido
      loadingSpinner.style.display = "none"
      contentContainer.innerHTML = html

      // Inicializar la vista específica
      if (view === "documents") {
        initDocumentsView()
      } else if (view === "calendar") {
        initCalendarView()
      } else if (view === "notes") {
        initNotesView()
      }

      // Cerrar sidebar en móvil
      if (window.innerWidth <= 768) {
        sidebar.classList.remove("open")
        document.body.classList.remove("sidebar-open")
      }
    } catch (error) {
      console.error("Error al cargar la vista:", error)
      loadingSpinner.style.display = "none"
      contentContainer.innerHTML = '<div class="error-message">Error al cargar la vista. Intente nuevamente.</div>'
    }
  }

  // Inicializar vista de documentos
  function initDocumentsView() {
    const tabs = document.querySelectorAll(".tab")
    const tabPanes = document.querySelectorAll(".tab-pane")
    const searchInput = document.getElementById("document-search")
    const documentsGrid = document.getElementById("documents-grid")
    const emptyDocuments = document.getElementById("empty-documents")

    // Cambiar entre pestañas
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"))
        tab.classList.add("active")

        const tabId = tab.dataset.tab
        tabPanes.forEach((pane) => {
          if (pane.id === `${tabId}-documents`) {
            pane.classList.add("active")
          } else {
            pane.classList.remove("active")
          }
        })
      })
    })

    // Cargar documentos
    loadDocuments()

    // Buscar documentos
    if (searchInput) {
      searchInput.addEventListener(
        "input",
        debounce(() => {
          loadDocuments(searchInput.value)
        }, 300),
      )
    }

    // Función para cargar documentos
    async function loadDocuments(search = "") {
      try {
        const url = search ? `/api/documents?search=${encodeURIComponent(search)}` : "/api/documents"
        const response = await fetch(url)
        const documents = await response.json()

        if (documents.length === 0) {
          documentsGrid.style.display = "none"
          emptyDocuments.style.display = "flex"
        } else {
          documentsGrid.style.display = "grid"
          emptyDocuments.style.display = "none"

          // Renderizar documentos
          documentsGrid.innerHTML = documents
            .map(
              (doc) => `
                        <div class="document-card">
                            <div class="document-thumbnail">
                                <i class="fas fa-file-alt"></i>
                                <div class="document-menu">
                                    <i class="fas fa-ellipsis-h"></i>
                                </div>
                            </div>
                            <div class="document-info">
                                <div class="document-title">${doc.title}</div>
                                <div class="document-subject">${doc.subject}</div>
                                <div class="document-date">Editado: ${doc.lastEdited}</div>
                            </div>
                        </div>
                    `,
            )
            .join("")
        }
      } catch (error) {
        console.error("Error al cargar documentos:", error)
        documentsGrid.innerHTML = '<div class="error-message">Error al cargar documentos</div>'
      }
    }
  }

  // Inicializar vista de calendario
  function initCalendarView() {
    const calendarDays = document.getElementById("calendar-days")
    const currentMonthElement = document.getElementById("current-month")
    const selectedDateElement = document.getElementById("selected-date")
    const eventsList = document.getElementById("events-list")
    const emptyEvents = document.getElementById("empty-events")
    const prevMonthBtn = document.getElementById("prev-month")
    const nextMonthBtn = document.getElementById("next-month")

    // Estado del calendario
    const today = new Date()
    let currentMonth = today.getMonth()
    let currentYear = today.getFullYear()
    let selectedDate = today

    // Renderizar calendario
    renderCalendar()

    // Cargar eventos para la fecha seleccionada
    loadEvents(selectedDate)

    // Event listeners
    prevMonthBtn.addEventListener("click", () => {
      currentMonth--
      if (currentMonth < 0) {
        currentMonth = 11
        currentYear--
      }
      renderCalendar()
    })

    nextMonthBtn.addEventListener("click", () => {
      currentMonth++
      if (currentMonth > 11) {
        currentMonth = 0
        currentYear++
      }
      renderCalendar()
    })

    // Función para renderizar el calendario
    function renderCalendar() {
      const months = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ]
      currentMonthElement.textContent = `${months[currentMonth]} ${currentYear}`

      const firstDay = new Date(currentYear, currentMonth, 1)
      const lastDay = new Date(currentYear, currentMonth + 1, 0)
      const daysInMonth = lastDay.getDate()

      // Ajustar para que la semana comience en lunes (0 = lunes, 6 = domingo)
      let firstDayIndex = firstDay.getDay() - 1
      if (firstDayIndex < 0) firstDayIndex = 6

      // Días del mes anterior
      const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate()

      // Generar HTML para los días
      let daysHTML = ""

      // Días del mes anterior
      for (let i = firstDayIndex; i > 0; i--) {
        const day = prevMonthLastDay - i + 1
        daysHTML += `<div class="day other-month" data-date="${currentYear}-${currentMonth === 0 ? 12 : currentMonth}-${day}">${day}</div>`
      }

      // Días del mes actual
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(currentYear, currentMonth, i)
        const isToday = isSameDay(date, today)
        const isSelected = isSameDay(date, selectedDate)

        daysHTML += `
                    <div class="day ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}" 
                         data-date="${currentYear}-${currentMonth + 1}-${i}">
                        ${i}
                        <div class="day-events"></div>
                    </div>
                `
      }

      // Días del mes siguiente
      const totalDays = firstDayIndex + daysInMonth
      const nextDays = 7 - (totalDays % 7)
      if (nextDays < 7) {
        for (let i = 1; i <= nextDays; i++) {
          daysHTML += `<div class="day other-month" data-date="${currentYear}-${currentMonth + 2}-${i}">${i}</div>`
        }
      }

      calendarDays.innerHTML = daysHTML

      // Cargar eventos para el mes
      loadEventsForMonth()

      // Añadir event listeners a los días
      document.querySelectorAll(".day:not(.other-month)").forEach((day) => {
        day.addEventListener("click", () => {
          document.querySelectorAll(".day").forEach((d) => d.classList.remove("selected"))
          day.classList.add("selected")

          const dateStr = day.dataset.date
          const [year, month, dayNum] = dateStr.split("-").map(Number)
          selectedDate = new Date(year, month - 1, dayNum)

          loadEvents(selectedDate)
        })
      })
    }

    // Función para cargar eventos del mes
    async function loadEventsForMonth() {
      try {
        const response = await fetch(`/api/events?month=${currentYear}-${currentMonth + 1}`)
        const events = await response.json()

        // Agrupar eventos por fecha
        const eventsByDate = {}
        events.forEach((event) => {
          if (!eventsByDate[event.date]) {
            eventsByDate[event.date] = []
          }
          eventsByDate[event.date].push(event)
        })

        // Añadir indicadores de eventos a los días
        Object.entries(eventsByDate).forEach(([date, events]) => {
          const dayElement = document.querySelector(`.day[data-date="${date}"]`)
          if (dayElement) {
            const eventsContainer = dayElement.querySelector(".day-events")
            eventsContainer.innerHTML = ""

            // Mostrar hasta 3 indicadores
            const maxDots = Math.min(events.length, 3)
            for (let i = 0; i < maxDots; i++) {
              const event = events[i]
              const dot = document.createElement("div")
              dot.className = "day-event-dot"

              // Color según tipo de evento
              if (event.type === "deadline") {
                dot.style.backgroundColor = "var(--error-color)"
              } else if (event.type === "exam") {
                dot.style.backgroundColor = "var(--warning-color)"
              } else if (event.type === "class") {
                dot.style.backgroundColor = "var(--info-color)"
              } else if (event.type === "meeting") {
                dot.style.backgroundColor = "var(--success-color)"
              }

              eventsContainer.appendChild(dot)
            }
          }
        })
      } catch (error) {
        console.error("Error al cargar eventos del mes:", error)
      }
    }

    // Función para cargar eventos de un día
    async function loadEvents(date) {
      try {
        const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
        const response = await fetch(
          `/api/events?day=${date.getDate()}&month=${date.getFullYear()}-${date.getMonth() + 1}`,
        )
        const events = await response.json()

        // Actualizar fecha seleccionada
        const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
        const months = [
          "Enero",
          "Febrero",
          "Marzo",
          "Abril",
          "Mayo",
          "Junio",
          "Julio",
          "Agosto",
          "Septiembre",
          "Octubre",
          "Noviembre",
          "Diciembre",
        ]
        selectedDateElement.textContent = `${days[date.getDay()]} ${date.getDate()} de ${months[date.getMonth()]}`

        // Mostrar eventos o mensaje vacío
        if (events.length === 0) {
          eventsList.style.display = "none"
          emptyEvents.style.display = "flex"
        } else {
          eventsList.style.display = "flex"
          emptyEvents.style.display = "none"

          // Renderizar eventos
          eventsList.innerHTML = events
            .map(
              (event) => `
                        <div class="event-card">
                            <div class="event-type ${event.type}">${getEventTypeLabel(event.type)}</div>
                            <div class="event-info">
                                <div class="event-title">${event.title}</div>
                                <div class="event-time">${event.time}</div>
                            </div>
                        </div>
                    `,
            )
            .join("")
        }
      } catch (error) {
        console.error("Error al cargar eventos:", error)
        eventsList.innerHTML = '<div class="error-message">Error al cargar eventos</div>'
      }
    }

    // Función para obtener etiqueta de tipo de evento
    function getEventTypeLabel(type) {
      switch (type) {
        case "deadline":
          return "Entrega"
        case "exam":
          return "Examen"
        case "class":
          return "Clase"
        case "meeting":
          return "Tutoría"
        default:
          return "Evento"
      }
    }

    // Función para comparar fechas
    function isSameDay(date1, date2) {
      return (
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
      )
    }
  }

  // Inicializar vista de notas
  function initNotesView() {
    const searchInput = document.getElementById("notes-search")
    const notesGrid = document.getElementById("notes-grid")
    const emptyNotes = document.getElementById("empty-notes")

    // Cargar notas
    loadNotes()

    // Buscar notas
    if (searchInput) {
      searchInput.addEventListener(
        "input",
        debounce(() => {
          loadNotes(searchInput.value)
        }, 300),
      )
    }

    // Función para cargar notas
    async function loadNotes(search = "") {
      try {
        const url = search ? `/api/notes?search=${encodeURIComponent(search)}` : "/api/notes"
        const response = await fetch(url)
        const notes = await response.json()

        if (notes.length === 0) {
          notesGrid.style.display = "none"
          emptyNotes.style.display = "flex"
        } else {
          notesGrid.style.display = "grid"
          emptyNotes.style.display = "none"

          // Renderizar notas
          notesGrid.innerHTML = notes
            .map(
              (note) => `
                        <div class="note-card" style="background-color: ${note.color}">
                            <div class="note-header">
                                <div class="note-title">${note.title}</div>
                                <div class="note-menu">
                                    <i class="fas fa-ellipsis-v"></i>
                                </div>
                            </div>
                            <div class="note-content">${note.content}</div>
                            <div class="note-date">Editado: ${note.lastEdited}</div>
                        </div>
                    `,
            )
            .join("")
        }
      } catch (error) {
        console.error("Error al cargar notas:", error)
        notesGrid.innerHTML = '<div class="error-message">Error al cargar notas</div>'
      }
    }
  }

  // Función debounce para evitar múltiples llamadas
  function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  // Event listeners para la navegación
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const view = item.dataset.view
      if (view) {
        loadView(view)
      }
    })
  })

  // Event listeners para el sidebar en móvil
  openSidebarBtn.addEventListener("click", () => {
    sidebar.classList.add("open")
    document.body.classList.add("sidebar-open")

    // Crear overlay
    const overlay = document.createElement("div")
    overlay.className = "overlay active"
    overlay.id = "sidebar-overlay"
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open")
      document.body.classList.remove("sidebar-open")
      overlay.remove()
    })
    document.body.appendChild(overlay)
  })

  closeSidebarBtn.addEventListener("click", () => {
    sidebar.classList.remove("open")
    document.body.classList.remove("sidebar-open")
    const overlay = document.getElementById("sidebar-overlay")
    if (overlay) overlay.remove()
  })

  // Cargar la vista inicial
  loadView("documents")
})

