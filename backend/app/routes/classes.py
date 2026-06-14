from flask import Blueprint, jsonify, request

from app.data.store import store


classes_bp = Blueprint("classes", __name__)


@classes_bp.get("")
def list_classes():
    return jsonify(store.classes)


@classes_bp.post("")
def create_class():
    payload = request.get_json() or {}
    training_class = {
        "id": store.next_id("classes"),
        "name": payload.get("name", "新班级"),
        "level": payload.get("level", "入门"),
        "teacher": payload.get("teacher", "待分配"),
        "room": payload.get("room", "待分配"),
        "status": payload.get("status", "招生中"),
        "capacity": int(payload.get("capacity", 20)),
        "students": [],
    }
    store.classes.append(training_class)
    return jsonify(training_class), 201


@classes_bp.get("/<int:class_id>")
def get_class(class_id):
    training_class = next((item for item in store.classes if item["id"] == class_id), None)
    if not training_class:
        return jsonify({"message": "Class not found"}), 404
    return jsonify(training_class)


@classes_bp.post("/<int:class_id>/students")
def add_student(class_id):
    training_class = next((item for item in store.classes if item["id"] == class_id), None)
    if not training_class:
        return jsonify({"message": "Class not found"}), 404

    payload = request.get_json() or {}
    student_ids = [student["id"] for item in store.classes for student in item["students"]]
    student = {
        "id": max(student_ids, default=0) + 1,
        "name": payload.get("name", "新学员"),
        "phone": payload.get("phone", ""),
    }
    training_class["students"].append(student)
    return jsonify(student), 201
