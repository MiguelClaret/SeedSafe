from flask import jsonify, request
from pathlib import Path
from werkzeug.utils import secure_filename
from uuid import uuid4


def upload_imagens_para_supabase(arquivos):
    from ...main import supabase
    links = []

    for arquivo in arquivos:
        nome_seguro = secure_filename(arquivo.filename)
        nome_unico = f"{uuid4().hex}_{nome_seguro}"
        dados = arquivo.read()

        response = supabase.storage.from_("documents").upload(nome_unico, dados)

        if not response:
            raise Exception("Upload error: Empty response")
        if isinstance(response, dict) and "error" in response:
            raise Exception(f"Upload error: {response['error']['message']}")

        url = supabase.storage.from_("documents").get_public_url(nome_unico)
        links.append(url)

    return ",".join(links)