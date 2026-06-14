from flask import Blueprint, jsonify, request

from app.data.store import store


attendance_bp = Blueprint("attendance", __name__)


@attendance_bp.get("")
def list_attendance():
    return jsonify(store.attendance)


@attendance_bp.post("")
def record_attendance():
    payload = request.get_json() or {}
    existing = next(
        (
            item
            for item in store.attendance
            if item["session_id"] == int(payload.get("session_id", 0))
            and item["student_id"] == int(payload.get("student_id", 0))
        ),
        None,
    )

    if existing:
        existing["status"] = payload.get("status", existing["status"])
        return jsonify(existing)

    record = {
        "id": store.next_id("attendance"),
        "session_id": int(payload.get("session_id", 0)),
        "student_id": int(payload.get("student_id", 0)),
        "status": payload.get("status", "present"),
    }
    store.attendance.append(record)
    return jsonify(record), 201
