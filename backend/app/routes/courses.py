from flask import Blueprint, jsonify, request

from app.data.store import store


courses_bp = Blueprint("courses", __name__)


@courses_bp.get("")
def list_courses():
    return jsonify(store.courses)


@courses_bp.post("")
def create_course():
    payload = request.get_json() or {}
    course = {
        "id": store.next_id("courses"),
        "title": payload.get("title", "新课程"),
        "duration": int(payload.get("duration", 2)),
        "category": payload.get("category", "通用"),
    }
    store.courses.append(course)
    return jsonify(course), 201
