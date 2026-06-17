from datetime import date, timedelta

from app.data.store import store


TIME_SLOTS = ["09:00-11:00", "14:00-16:00", "19:00-21:00"]


def get_class_student_count(class_id):
    training_class = next(
        (item for item in store.classes if item["id"] == class_id), None
    )
    if not training_class:
        return 0
    return len(training_class.get("students", []))


def get_classroom_capacity(room_name):
    classroom = next(
        (item for item in store.classrooms if item["name"] == room_name), None
    )
    if not classroom:
        return None
    return classroom["capacity"]


def session_needs_reassign(session):
    student_count = get_class_student_count(session["class_id"])
    classroom_capacity = get_classroom_capacity(session["room"])

    if not is_classroom_available(session["room"], session["time"]):
        return True, "教室不可用"

    if classroom_capacity is not None and student_count > classroom_capacity:
        return True, f"容量不足（{student_count}人 > {classroom_capacity}人）"

    return False, None


def is_classroom_available(room_name, time_slot, required_capacity=0):
    classroom = next(
        (item for item in store.classrooms if item["name"] == room_name), None
    )
    if not classroom:
        return True
    if classroom["status"] != "available":
        return False
    if time_slot not in classroom["available_times"]:
        return False
    if required_capacity > 0 and classroom["capacity"] < required_capacity:
        return False
    return True


def find_available_room(preferred_room, time_slot, required_capacity=0):
    if is_classroom_available(preferred_room, time_slot, required_capacity):
        return preferred_room
    sorted_classrooms = sorted(
        store.classrooms,
        key=lambda c: c["capacity"],
    )
    for classroom in sorted_classrooms:
        if classroom["status"] == "available" \
                and time_slot in classroom["available_times"] \
                and (required_capacity == 0 or classroom["capacity"] >= required_capacity):
            return classroom["name"]
    return None


def find_available_slot_and_room(
    class_id,
    preferred_room,
    required_capacity,
    exclude_session_id=None,
):
    occupied_keys = {
        (item["date"], item["time"], item["room"])
        for item in store.schedule
        if exclude_session_id is None or item["id"] != exclude_session_id
    }
    class_occupied = {
        (item["date"], item["time"])
        for item in store.schedule
        if item["class_id"] == class_id
        and (exclude_session_id is None or item["id"] != exclude_session_id)
    }

    eligible_classrooms = [
        c for c in store.classrooms
        if c["status"] == "available"
        and (required_capacity == 0 or c["capacity"] >= required_capacity)
    ]

    if not eligible_classrooms:
        available_count = sum(1 for c in store.classrooms if c["status"] == "available")
        if available_count == 0:
            return None, None, None, "没有可用的教室"
        else:
            max_cap = max((c["capacity"] for c in store.classrooms if c["status"] == "available"), default=0)
            return None, None, None, f"没有容量足够的教室（需要{required_capacity}人，最大可用{max_cap}人）"

    has_any_free_slot = False
    cursor = date.today()
    for _ in range(60):
        if cursor.weekday() < 5:
            for time_slot in TIME_SLOTS:
                if (cursor.isoformat(), time_slot) in class_occupied:
                    continue
                room = find_available_room(
                    preferred_room, time_slot, required_capacity
                )
                if not room:
                    continue
                if (cursor.isoformat(), time_slot, room) in occupied_keys:
                    has_any_free_slot = True
                    continue
                return cursor.isoformat(), time_slot, room, None
        cursor += timedelta(days=1)

    return None, None, None, "未来60天内没有找到空闲的时段和教室组合"


def generate_schedule(class_id=None, days=10):
    classes = store.classes
    if class_id:
        classes = [item for item in classes if item["id"] == int(class_id)]

    if not classes:
        return []

    existing_session_keys = {
        (item["class_id"], item["date"], item["time"])
        for item in store.schedule
    }

    generated = []
    cursor = date.today() + timedelta(days=1)
    course_index = 0
    max_attempts = days * 10
    attempts = 0

    while len(generated) < days and attempts < max_attempts:
        attempts += 1
        if cursor.weekday() < 5:
            for training_class in classes:
                student_count = get_class_student_count(training_class["id"])
                time_slot = TIME_SLOTS[course_index % len(TIME_SLOTS)]
                room = find_available_room(
                    training_class["room"], time_slot, student_count
                )

                if not room:
                    course_index += 1
                    continue

                session_key = (training_class["id"], cursor.isoformat(), time_slot)
                if session_key in existing_session_keys:
                    course_index += 1
                    continue

                occupied_key = (cursor.isoformat(), time_slot, room)
                room_occupied = any(
                    s["date"] == cursor.isoformat()
                    and s["time"] == time_slot
                    and s["room"] == room
                    for s in store.schedule
                )
                if room_occupied:
                    course_index += 1
                    continue

                course = store.courses[course_index % len(store.courses)]
                session = {
                    "id": store.next_id("schedule"),
                    "class_id": training_class["id"],
                    "course_id": course["id"],
                    "date": cursor.isoformat(),
                    "time": time_slot,
                    "room": room,
                    "teacher": training_class["teacher"],
                }
                store.schedule.append(session)
                generated.append(session)
                existing_session_keys.add(session_key)
                course_index += 1
                if len(generated) >= days:
                    break
        cursor += timedelta(days=1)

    return generated


def reassign_unavailable_sessions(classroom_name=None):
    target_sessions = []
    if classroom_name:
        target_sessions = [
            s for s in store.schedule
            if s["room"] == classroom_name
        ]
    else:
        target_sessions = [
            s for s in store.schedule
            if session_needs_reassign(s)[0]
        ]

    success = []
    failed = []

    for session in target_sessions:
        needs_reassign, reason = session_needs_reassign(session)
        if not needs_reassign:
            continue

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
            "reason": reason,
        }

        new_date, new_time, new_room, fail_reason = find_available_slot_and_room(
            session["class_id"],
            preferred_room,
            student_count,
            exclude_session_id=session["id"],
        )

        if new_date and new_time and new_room:
            session["date"] = new_date
            session["time"] = new_time
            session["room"] = new_room
            success.append({
                **old_info,
                "new_date": new_date,
                "new_time": new_time,
                "new_room": new_room,
            })
        else:
            failed.append({
                **old_info,
                "fail_reason": fail_reason or "未知原因",
            })

    return {
        "success": success,
        "failed": failed,
        "total": len(target_sessions),
        "success_count": len(success),
        "failed_count": len(failed),
    }


def enrich_session(session):
    training_class = next(
        (item for item in store.classes if item["id"] == session["class_id"]), None
    )
    course = next((item for item in store.courses if item["id"] == session["course_id"]), None)
    classroom = next(
        (item for item in store.classrooms if item["name"] == session["room"]), None
    )
    student_count = get_class_student_count(session["class_id"])
    classroom_capacity = get_classroom_capacity(session["room"])
    needs_reassign, reassign_reason = session_needs_reassign(session)

    return {
        **session,
        "class_name": training_class["name"] if training_class else "未知班级",
        "course_title": course["title"] if course else "未知课程",
        "duration": course["duration"] if course else 0,
        "room_status": classroom["status"] if classroom else "available",
        "room_capacity": classroom_capacity,
        "class_size": student_count,
        "capacity_enough": classroom_capacity is None or student_count <= classroom_capacity,
        "room_available": is_classroom_available(session["room"], session["time"]),
        "needs_reassign": needs_reassign,
        "reassign_reason": reassign_reason,
    }
