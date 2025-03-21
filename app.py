from flask import Flask, request, jsonify, send_from_directory
import os
import json
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__, static_folder='.')
CORS(app)  # Habilitar CORS para todas las rutas

# Directorio para almacenar los datos
DATA_DIR = 'data'
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# Ruta para archivos estáticos
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

# Convertir objetos datetime a string para JSON
def json_serial(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

# API para guardar datos
@app.route('/api/save', methods=['POST'])
def save_data():
    try:
        data = request.json
        
        # Guardar datos en un archivo JSON
        with open(os.path.join(DATA_DIR, 'app_data.json'), 'w') as f:
            json.dump(data, f, default=json_serial)
        
        return jsonify({"success": True, "message": "Datos guardados correctamente"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# API para cargar datos
@app.route('/api/load', methods=['GET'])
def load_data():
    try:
        data_file = os.path.join(DATA_DIR, 'app_data.json')
        
        if not os.path.exists(data_file):
            return jsonify({"success": False, "message": "No hay datos guardados"}), 404
        
        with open(data_file, 'r') as f:
            data = json.load(f)
        
        return jsonify(data)
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# API para buscar documentos
@app.route('/api/search', methods=['GET'])
def search_documents():
    try:
        query = request.args.get('q', '').lower()
        
        if not query:
            return jsonify({"success": False, "message": "Consulta de búsqueda vacía"}), 400
        
        data_file = os.path.join(DATA_DIR, 'app_data.json')
        
        if not os.path.exists(data_file):
            return jsonify({"success": False, "message": "No hay datos guardados"}), 404
        
        with open(data_file, 'r') as f:
            data = json.load(f)
        
        results = []
        
        # Buscar en todos los documentos
        for folder_id, documents in data.get('documents', {}).items():
            for doc in documents:
                # Buscar en título y contenido
                if (query in doc.get('title', '').lower() or 
                    query in doc.get('content', '').lower()):
                    
                    # Encontrar el nombre de la carpeta
                    folder_name = "Desconocido"
                    for folder in data.get('folders', []):
                        if folder.get('id') == folder_id:
                            folder_name = folder.get('name')
                            break
                    
                    results.append({
                        "id": doc.get('id'),
                        "title": doc.get('title'),
                        "folder_id": folder_id,
                        "folder_name": folder_name,
                        "updated_at": doc.get('updatedAt')
                    })
        
        return jsonify({
            "success": True,
            "results": results,
            "count": len(results)
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# API para exportar documento como PDF (simulado)
@app.route('/api/export/<document_id>', methods=['GET'])
def export_document(document_id):
    try:
        # En una implementación real, aquí generaríamos un PDF
        # Para este ejemplo, solo devolvemos un mensaje de éxito
        return jsonify({
            "success": True,
            "message": f"Documento {document_id} exportado correctamente",
            "download_url": f"/download/{document_id}.pdf"
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)

