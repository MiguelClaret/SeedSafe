from flask import request, Blueprint
from ..services.user_services import *
from ..models.user import User

# Instancia o blueprint
user_bp = Blueprint('user', __name__, url_prefix='/user')

#Rotas do usuario
@user_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    return register_user(data)

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    return login_user(data)

@user_bp.route('/delete/<id_user>', methods=['DELETE'])
def delete(id_user):
    return delete_user(id_user)

@user_bp.route('<int:id_user>', methods=['GET'])
def get_user(id_user):
    return get_user_by_id(id_user)

@user_bp.route('/role/<int:id_role>', methods=['GET'])
def users_by_cargo(id_role):
    return get_users_by_role(id_role)

@user_bp.route('/all', methods=['GET'])
def get_all():
    return get_all_users()
