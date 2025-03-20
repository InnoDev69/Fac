from flask import Flask, render_template, jsonify, request
import sqlite3
import os
from datetime import datetime, timedelta
import random

app = Flask(__name__)

# Configuración para servir archivos estáticos desde la carpeta static
app.static_folder = 'static'

# Configuración de la base de datos SQLite
DB_PATH = os.path.join(os.path.dirname(__file__), 'database.db')

def get_db_connection():
    """Crea una conexión a la base de datos SQLite"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Para acceder a las columnas por nombre
    return conn

def init_db():
    """Inicializa la base de datos si no existe"""
    # Verificar si la base de datos ya existe
    if os.path.exists(DB_PATH):
        return
        
    print("Inicializando base de datos...")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Crear tablas
    cursor.execute('''
    CREATE TABLE documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        last_edited TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        color TEXT DEFAULT '#FFFFFF',
        last_edited TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        date DATE NOT NULL,
        time TEXT NOT NULL,
        type TEXT NOT NULL
    )
    ''')
    
    # Insertar datos de ejemplo
    # Documentos
    documents = [
        ("Apuntes Cálculo Diferencial", "Matemáticas", datetime.now().strftime('%Y-%m-%d %H:%M:%S')),
        ("Informe de Laboratorio", "Física", (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S')),
        ("Resumen Algoritmos", "Programación", (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d %H:%M:%S')),
        ("Ejercicios Ecuaciones", "Matemáticas", (datetime.now() - timedelta(days=3)).strftime('%Y-%m-%d %H:%M:%S')),
        ("Presentación Química Orgánica", "Química", (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S'))
    ]
    
    cursor.executemany(
        "INSERT INTO documents (title, subject, last_edited) VALUES (?, ?, ?)",
        documents
    )
    
    # Notas
    notes = [
        ("Fórmulas Cálculo", "Derivada de una función: f'(x) = lim h→0 [f(x+h) - f(x)]/h\nRegla de la cadena: (f∘g)'(x) = f'(g(x))·g'(x)", "#FFF9C4", datetime.now().strftime('%Y-%m-%d %H:%M:%S')),
        ("Conceptos Física", "Ley de Newton: F = m·a\nEnergía cinética: Ec = 1/2·m·v²\nEnergía potencial: Ep = m·g·h", "#BBDEFB", (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S')),
        ("Comandos SQL", "SELECT * FROM tabla;\nINSERT INTO tabla VALUES (...);\nUPDATE tabla SET campo = valor WHERE condición;", "#C8E6C9", (datetime.now() - timedelta(days=3)).strftime('%Y-%m-%d %H:%M:%S')),
        ("Vocabulario Inglés", "Research - Investigación\nDevelopment - Desarrollo\nImplementation - Implementación", "#E1BEE7", (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S'))
    ]
    
    cursor.executemany(
        "INSERT INTO notes (title, content, color, last_edited) VALUES (?, ?, ?, ?)",
        notes
    )
    
    # Eventos
    today = datetime.now()
    events = []
    event_types = ["deadline", "exam", "class", "meeting"]
    event_titles = {
        "deadline": ["Entrega Informe Física", "Entrega Proyecto Final", "Entrega Ejercicios"],
        "exam": ["Examen Cálculo", "Examen Programación", "Examen Química"],
        "class": ["Clase Programación", "Clase Matemáticas", "Clase Física"],
        "meeting": ["Tutoría Química", "Reunión Grupo Estudio", "Consulta Profesor"]
    }
    
    for i in range(30):
        if random.random() > 0.7:  # 30% de probabilidad de tener eventos
            continue
            
        day = today + timedelta(days=i)
        num_events = random.randint(1, 3)  # 1-3 eventos por día
        
        for j in range(num_events):
            event_type = random.choice(event_types)
            events.append((
                random.choice(event_titles[event_type]),
                day.strftime('%Y-%m-%d'),
                f"{random.randint(8, 18):02d}:{random.choice(['00', '30'])}",
                event_type
            ))
    
    cursor.executemany(
        "INSERT INTO events (title, date, time, type) VALUES (?, ?, ?, ?)",
        events
    )
    
    conn.commit()
    conn.close()
    print("Base de datos inicializada correctamente")

# Inicializar la base de datos al arrancar
init_db()

# Función para formatear fecha de última edición
def format_last_edited(date_str):
    last_edited = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
    days = (datetime.now() - last_edited).days
    
    if days == 0:
        return "Hoy"
    elif days == 1:
        return "Ayer"
    elif days < 7:
        return f"Hace {days} días"
    else:
        weeks = days // 7
        return f"Hace {weeks} semana{'s' if weeks > 1 else ''}"

# Rutas para la aplicación
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/documents')
def documents():
    return render_template('documents.html')

@app.route('/calendar')
def calendar():
    return render_template('calendar.html')

@app.route('/notes')
def notes():
    return render_template('notes.html')

# API para obtener documentos
@app.route('/api/documents')
def get_documents():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    search_query = request.args.get('search', '').lower()
    if search_query:
        cursor.execute(
            "SELECT * FROM documents WHERE LOWER(title) LIKE ? OR LOWER(subject) LIKE ?",
            (f'%{search_query}%', f'%{search_query}%')
        )
    else:
        cursor.execute("SELECT * FROM documents ORDER BY last_edited DESC")
    
    documents = cursor.fetchall()
    conn.close()
    
    result = []
    for doc in documents:
        result.append({
            "id": str(doc['id']),
            "title": doc['title'],
            "subject": doc['subject'],
            "lastEdited": format_last_edited(doc['last_edited'])
        })
    
    return jsonify(result)

# API para crear un nuevo documento
@app.route('/api/documents', methods=['POST'])
def create_document():
    data = request.json
    
    if not data or not data.get('title') or not data.get('subject'):
        return jsonify({"error": "Título y asignatura son obligatorios"}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "INSERT INTO documents (title, subject) VALUES (?, ?)",
        (data.get('title'), data.get('subject'))
    )
    
    doc_id = cursor.lastrowid
    conn.commit()
    
    # Obtener el documento recién creado
    cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    doc = cursor.fetchone()
    conn.close()
    
    return jsonify({
        "id": str(doc['id']),
        "title": doc['title'],
        "subject": doc['subject'],
        "lastEdited": "Hoy"
    }), 201

# API para actualizar un documento
@app.route('/api/documents/<int:id>', methods=['PUT'])
def update_document(id):
    data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verificar si el documento existe
    cursor.execute("SELECT * FROM documents WHERE id = ?", (id,))
    doc = cursor.fetchone()
    
    if not doc:
        conn.close()
        return jsonify({"error": "Documento no encontrado"}), 404
    
    # Actualizar campos
    title = data.get('title', doc['title'])
    subject = data.get('subject', doc['subject'])
    
    cursor.execute(
        "UPDATE documents SET title = ?, subject = ?, last_edited = ? WHERE id = ?",
        (title, subject, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), id)
    )
    
    conn.commit()
    conn.close()
    
    return jsonify({
        "id": str(id),
        "title": title,
        "subject": subject,
        "lastEdited": "Hoy"
    })

# API para eliminar un documento
@app.route('/api/documents/<int:id>', methods=['DELETE'])
def delete_document(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM documents WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Documento eliminado correctamente"}), 200

# API para obtener notas
@app.route('/api/notes')
def get_notes():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    search_query = request.args.get('search', '').lower()
    if search_query:
        cursor.execute(
            "SELECT * FROM notes WHERE LOWER(title) LIKE ? OR LOWER(content) LIKE ?",
            (f'%{search_query}%', f'%{search_query}%')
        )
    else:
        cursor.execute("SELECT * FROM notes ORDER BY last_edited DESC")
    
    notes = cursor.fetchall()
    conn.close()
    
    result = []
    for note in notes:
        result.append({
            "id": str(note['id']),
            "title": note['title'],
            "content": note['content'],
            "color": note['color'],
            "lastEdited": format_last_edited(note['last_edited'])
        })
    
    return jsonify(result)

# API para crear una nueva nota
@app.route('/api/notes', methods=['POST'])
def create_note():
    data = request.json
    
    if not data or not data.get('title') or not data.get('content'):
        return jsonify({"error": "Título y contenido son obligatorios"}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "INSERT INTO notes (title, content, color) VALUES (?, ?, ?)",
        (data.get('title'), data.get('content'), data.get('color', '#FFFFFF'))
    )
    
    note_id = cursor.lastrowid
    conn.commit()
    
    # Obtener la nota recién creada
    cursor.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
    note = cursor.fetchone()
    conn.close()
    
    return jsonify({
        "id": str(note['id']),
        "title": note['title'],
        "content": note['content'],
        "color": note['color'],
        "lastEdited": "Hoy"
    }), 201

# API para actualizar una nota
@app.route('/api/notes/<int:id>', methods=['PUT'])
def update_note(id):
    data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verificar si la nota existe
    cursor.execute("SELECT * FROM notes WHERE id = ?", (id,))
    note = cursor.fetchone()
    
    if not note:
        conn.close()
        return jsonify({"error": "Nota no encontrada"}), 404
    
    # Actualizar campos
    title = data.get('title', note['title'])
    content = data.get('content', note['content'])
    color = data.get('color', note['color'])
    
    cursor.execute(
        "UPDATE notes SET title = ?, content = ?, color = ?, last_edited = ? WHERE id = ?",
        (title, content, color, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), id)
    )
    
    conn.commit()
    conn.close()
    
    return jsonify({
        "id": str(id),
        "title": title,
        "content": content,
        "color": color,
        "lastEdited": "Hoy"
    })

# API para eliminar una nota
@app.route('/api/notes/<int:id>', methods=['DELETE'])
def delete_note(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM notes WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Nota eliminada correctamente"}), 200

# API para obtener eventos
@app.route('/api/events')
def get_events():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    month = request.args.get('month')
    day = request.args.get('day')
    
    if day and month:
        # Filtrar por día específico
        cursor.execute(
            "SELECT * FROM events WHERE date = ? ORDER BY time",
            (f"{month}-{day}",)
        )
    elif month:
        # Filtrar por mes (formato esperado: YYYY-MM)
        cursor.execute(
            "SELECT * FROM events WHERE date LIKE ? ORDER BY date, time",
            (f"{month}%",)
        )
    else:
        cursor.execute("SELECT * FROM events ORDER BY date, time")
    
    events = cursor.fetchall()
    conn.close()
    
    result = []
    for event in events:
        result.append({
            "id": str(event['id']),
            "title": event['title'],
            "date": event['date'],
            "time": event['time'],
            "type": event['type']
        })
    
    return jsonify(result)

# API para crear un nuevo evento
@app.route('/api/events', methods=['POST'])
def create_event():
    data = request.json
    
    if not data or not data.get('title') or not data.get('date') or not data.get('time') or not data.get('type'):
        return jsonify({"error": "Título, fecha, hora y tipo son obligatorios"}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        "INSERT INTO events (title, date, time, type) VALUES (?, ?, ?, ?)",
        (data.get('title'), data.get('date'), data.get('time'), data.get('type'))
    )
    
    event_id = cursor.lastrowid
    conn.commit()
    
    # Obtener el evento recién creado
    cursor.execute("SELECT * FROM events WHERE id = ?", (event_id,))
    event = cursor.fetchone()
    conn.close()
    
    return jsonify({
        "id": str(event['id']),
        "title": event['title'],
        "date": event['date'],
        "time": event['time'],
        "type": event['type']
    }), 201

# API para actualizar un evento
@app.route('/api/events/<int:id>', methods=['PUT'])
def update_event(id):
    data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verificar si el evento existe
    cursor.execute("SELECT * FROM events WHERE id = ?", (id,))
    event = cursor.fetchone()
    
    if not event:
        conn.close()
        return jsonify({"error": "Evento no encontrado"}), 404
    
    # Actualizar campos
    title = data.get('title', event['title'])
    date = data.get('date', event['date'])
    time = data.get('time', event['time'])
    event_type = data.get('type', event['type'])
    
    cursor.execute(
        "UPDATE events SET title = ?, date = ?, time = ?, type = ? WHERE id = ?",
        (title, date, time, event_type, id)
    )
    
    conn.commit()
    conn.close()
    
    return jsonify({
        "id": str(id),
        "title": title,
        "date": date,
        "time": time,
        "type": event_type
    })

# API para eliminar un evento
@app.route('/api/events/<int:id>', methods=['DELETE'])
def delete_event(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM events WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Evento eliminado correctamente"}), 200

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)