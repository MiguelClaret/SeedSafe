from supabase import create_client, Client
import os
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from flask_bcrypt import Bcrypt



# importa a instância do SQLAlchemy
from .config.database import db
from sqlalchemy import create_engine

# importa todos os seus models para registro no metadata
from .app.models.user import User
from .app.models.role import Role



# importa seus blueprints
from .app.routes.users import user_bp
from .app.routes.documents import documents_bp


# Load environment variables from .env
load_dotenv()
bcrypt = Bcrypt()

url = os.getenv("url_supabase")  # sua URL do projeto Supabase
key =  os.getenv("anon") # sua anon/public key
supabase: Client = create_client(url, key)

def popular_cargos():
    standard_jobs = ['Admin', 'Auditor', 'Producer', 'Investor']
    for desc in standard_jobs:
        if not Role.query.filter_by(description=desc).first():
            db.session.add(Role(description=desc))
    db.session.commit()

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Fetch variables
    USER = os.getenv("user")
    PASSWORD = os.getenv("password")
    HOST = os.getenv("host")
    PORT = os.getenv("port")
    DBNAME = os.getenv("dbname")

    # Construct the SQLAlchemy connection string
    DATABASE_URL = f"postgresql+psycopg2://{USER}:{PASSWORD}@{HOST}:{PORT}/{DBNAME}?sslmode=require"

    # Create the SQLAlchemy engine
    engine = create_engine(DATABASE_URL)

    # Test the connection
    try:
        with engine.connect() as connection:
            print("Connection successful!")
    except Exception as e:
        print(f"Failed to connect: {e}")
    
    app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
 

    # Inicializa o banco no app
    db.init_app(app)

    # Criando o banco de dados e tabelas
    with app.app_context():
        db.create_all()
        popular_cargos()

    # Registrando as rotas 
    app.register_blueprint(user_bp)
    app.register_blueprint(documents_bp)


    return app

# Configurando para iniciar o projeto
app = create_app()

if __name__ == '__main__':
    app.run(debug=True)