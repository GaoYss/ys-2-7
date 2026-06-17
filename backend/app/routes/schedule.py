from flask import Blueprint, jsonify, request

from app.data.store import store
from app.services.scheduler import (
    enrich_session,
    find_available_slot_and_room,
    generate_schedule,
    get_class_student_count,
    session_needs_reassign,
    reassign_unavailable_sessions,
)


schedule_bp = Blueprint("schedule", __name__)


@schedule_bp.get("")
def list_schedule():
    return jsonify([enrich_session(item) for item in store.schedule])


@schedule_bp.post("/generate")
def generate():
    payload = request.get_json() or {}
    generated = generate_schedule(
        class_id=payload.get("class_id"),
        days=int(payload.get("days", 8)),
    )
    return jsonify([enrich_session(item) for item in generated]), 201


@schedule_bp.post("/reassign")
def reassign():
    payload = request.get_json() or {}
    result = reassign_unavailable_sessions(
        classroom_name=payload.get("classroom_name"),
    )
    return jsonify(result)


@schedule_bp.post("/<int:session_id>/reassign")
def reassign_single(session_id):
    session = next(
        (item for item in store.schedule if item["id"] == session_id), None
    )
    if not session:
        return jsonify({"message": "Session not found"}), 404

    needs_reassign, reason = session_needs_reassign(session)

    student_count = get_class_student_count(session["class_id"])
    training_class = next(
        (item for item in store.classes if item["id"] == session["class_id"]), None
    )
    preferred_room = training_class["room"] if training_class else session["room"]

    old_info = {
        "id": session["id"],
        "class_name": training_class["name"] if training_class else "未知班级",
        "old_date": session["date"],
        "old_time": session["time"],
        "old_room": session["room"],
        "reason": reason if needs_reassign else "用户手动重新分配",
    }

    new_date, new_time, new_room, fail_reason = find_available_slot_and_room(
        session["class_id"],
        preferred_room,
        student_count,
        exclude_session_id=session["id"],
    )

    if not new_date or not new_time or not new_room:
        return jsonify({
            "success": [],
            "failed": [{
                **old_info,
                "fail_reason": fail_reason or "未知原因",
            }],
            "total": 1,
            "success_count": 0,
            "failed_count": 1,
        }), 200

    session["date"] = new_date
    session["time"] = new_time
    session["room"] = new_room

    return jsonify({
        "success": [{
            **old_info,
            "new_date": new_date,
            "new_time": new_time,
            "new_room": new_room,
        }],
        "failed": [],
        "total": 1,
        "success_count": 1,
        "failed_count": 0,
    })
