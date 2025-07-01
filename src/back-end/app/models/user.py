from ...config.database import db 

#Criando a tabela
class User(db.Model):
    __tablename__ = 'user' # Define o nome da tabela

    # Definindo as colunas
    id = db.Column(db.Integer, primary_key=True, nullable=False)
    email = db.Column(db.String(200), unique=True, nullable=False)
    password = db.Column(db.String(), nullable=False)
    full_name = db.Column(db.String(200), nullable=False)
    id_role = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=False)
    wallet_address = db.Column(db.String(), nullable=False)
    

    role = db.relationship('Role', backref=db.backref('users', lazy=True))


    # Função para transformar em json
    def as_dict(self):
        return{
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role.description,
            'id_role': self.id_role,
            'wallet_address': self.wallet_address
            }