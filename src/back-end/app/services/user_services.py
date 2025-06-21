from ..models.user import User
from ...config.database import db
from flask import jsonify

def register_user(data):
    from ...main import bcrypt  # Importa o bcrypt do main
    try:
        email = data['email']
        password = data['password']

        if User.query.filter_by(email=email).first():
            raise Exception("Email already registered")

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = User(
            email=email,
            password=hashed_password,
            full_name=data['full_name'],
            id_role=data['id_role'],
            wallet_address=data['wallet_address']
        )

        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "User registered successfully!"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def login_user(data):
    from ...main import bcrypt  # Importa o bcrypt do main
    try:
        email = data['email']
        password = data['password']

        user = User.query.filter_by(email=email).first()

        if not user or not bcrypt.check_password_hash(user.password, password):
            raise Exception("Invalid username or password")

        return jsonify("Login successfully"), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def delete_user(id_user):
    try:
        user = db.session.get(User, id_user)
        if not user:
            raise Exception("User not found!")

        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "User deleted successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_user_by_id(id_user):
    try:
        user = db.session.get(User, id_user)
        if not user:
            raise Exception("User not found!")

        return jsonify({
            "message": "User found successfully",
            "user": user.as_dict()
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_users_by_role(id_role):
    try:
        users = User.query.filter_by(id_role=id_role).all()
        if not users:
            raise Exception("There are no users with this role.")

        return jsonify({
            "message": "Users found successfully",
            "users": [user.as_dict() for user in users]
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
def get_all_users():
    try:
        users = User.query.all()
        if not users:
            raise Exception("There are no users!")

        return jsonify({
            "message": "Users found successfully",
            "users": [user.as_dict() for user in users]
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
