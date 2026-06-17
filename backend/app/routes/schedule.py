from flask import Blueprint, jsonify, request

from app.data.store import store
from app.services.scheduler import (
    enrich_session,
    find_available_slot_and_room,
    generate_schedule,
    get_class_student_count,
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
    reassigned = reassign_unavailable_sessions(
        classroom_name=payload.get("classroom_name"),
    )
    return jsonify([enrich_session(item) for item in reassigned])


@schedule_bp.post("/<int:session_id>/reassign")
def reassign_single(session_id):
    session = next(
        (item for item in store.schedule if item["id"] == session_id), None
    )
    if not session:
        return jsonify({"message": "Session not found"}), 404

    student_count = get_class_student_count(session["class_id"])
    training_class = next(
        (item for item in store.classes if item["id"] == session["class_id"]), None
    )
    preferred_room = training_class["room"] if training_class else session["room"]

    new_date, new_time, new_room = find_available_slot_and_room(
        session["class_id"],
        preferred_room,
        student_count,
        exclude_session_id=session["id"],
    )

    if not new_date or not new_time or not new_room:
        return jsonify({"message": "没有找到可用的教室和时段"}), 400

    session["date"] = new_date
    session["time"] = new_time
    session["room"] = new_room

    return jsonify(enrich_session(session))
