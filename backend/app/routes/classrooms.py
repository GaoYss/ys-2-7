from flask import Blueprint, jsonify, request

from app.data.store import store


classrooms_bp = Blueprint("classrooms", __name__)


@classrooms_bp.get("")
def list_classrooms():
    return jsonify(store.classrooms)


@classrooms_bp.post("")
def create_classroom():
    payload = request.get_json() or {}
    classroom = {
        "id": store.next_id("classrooms"),
        "name": payload.get("name", "新教室"),
        "capacity": int(payload.get("capacity", 20)),
        "available_times": payload.get("available_times", ["09:00-11:00", "14:00-16:00", "19:00-21:00"]),
        "status": payload.get("status", "available"),
    }
    store.classrooms.append(classroom)
    return jsonify(classroom), 201


@classrooms_bp.get("/<int:classroom_id>")
def get_classroom(classroom_id):
    classroom = next(
        (item for item in store.classrooms if item["id"] == classroom_id), None
    )
    if not classroom:
        return jsonify({"message": "Classroom not found"}), 404
    return jsonify(classroom)


@classrooms_bp.put("/<int:classroom_id>")
def update_classroom(classroom_id):
    classroom = next(
        (item for item in store.classrooms if item["id"] == classroom_id), None
    )
    if not classroom:
        return jsonify({"message": "Classroom not found"}), 404

    payload = request.get_json() or {}
    if "name" in payload:
        classroom["name"] = payload["name"]
    if "capacity" in payload:
        classroom["capacity"] = int(payload["capacity"])
    if "available_times" in payload:
        classroom["available_times"] = payload["available_times"]
    if "status" in payload:
        classroom["status"] = payload["status"]

    return jsonify(classroom)


@classrooms_bp.delete("/<int:classroom_id>")
def delete_classroom(classroom_id):
    classroom = next(
        (item for item in store.classrooms if item["id"] == classroom_id), None
    )
    if not classroom:
        return jsonify({"message": "Classroom not found"}), 404

    used_in_classes = any(
        item["room"] == classroom["name"] for item in store.classes
    )
    used_in_schedule = any(
        item["room"] == classroom["name"] for item in store.schedule
    )
    if used_in_classes or used_in_schedule:
        return jsonify({
            "message": "教室已被使用，无法删除。请先将相关班级和课次分配到其他教室。"
        }), 400

    store.classrooms = [item for item in store.classrooms if item["id"] != classroom_id]
    return jsonify({"message": "教室已删除"})
