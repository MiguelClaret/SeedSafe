from ...config.database import db 

#Criando a tabela
class Role(db.Model):
    __tablename__ = 'role'

    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(), nullable=False, unique=True)
    

    # Função para transformar em json
    def as_dict(self):
        return{
            'id': self.id,
            'description': self.description
            }