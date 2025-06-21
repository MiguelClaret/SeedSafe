from flask import request, Blueprint
from ..services.documents_services import *

# Instancia o blueprint
documents_bp = Blueprint('documents', __name__, url_prefix='/document')

@documents_bp.route("/upload", methods=["POST"])
def upload():
    if 'imagens' not in request.files:
        return jsonify({"error": "Missing 'images' field"}), 400

    arquivos = request.files.getlist("imagens")

    try:
        links = upload_imagens_para_supabase(arquivos)
        return jsonify({"links":links}), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

