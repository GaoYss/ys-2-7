from datetime import date, timedelta

from app.data.store import store


TIME_SLOTS = ["09:00-11:00", "14:00-16:00", "19:00-21:00"]


def is_classroom_available(room_name, time_slot):
    classroom = next(
        (item for item in store.classrooms if item["name"] == room_name), None
    )
    if not classroom:
        return True
    if classroom["status"] != "available":
        return False
    if time_slot not in classroom["available_times"]:
        return False
    return True


def find_available_room(preferred_room, time_slot):
    if is_classroom_available(preferred_room, time_slot):
        return preferred_room
    for classroom in store.classrooms:
        if classroom["status"] == "available" and time_slot in classroom["available_times"]:
            return classroom["name"]
    return None


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
                time_slot = TIME_SLOTS[course_index % len(TIME_SLOTS)]
                room = find_available_room(training_class["room"], time_slot)

                if not room:
                    course_index += 1
                    continue

                session_key = (training_class["id"], cursor.isoformat(), time_slot)
                if session_key in existing_session_keys:
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


def enrich_session(session):
    training_class = next(
        (item for item in store.classes if item["id"] == session["class_id"]), None
    )
    course = next((item for item in store.courses if item["id"] == session["course_id"]), None)
    classroom = next(
        (item for item in store.classrooms if item["name"] == session["room"]), None
    )
    return {
        **session,
        "class_name": training_class["name"] if training_class else "未知班级",
        "course_title": course["title"] if course else "未知课程",
        "duration": course["duration"] if course else 0,
        "room_status": classroom["status"] if classroom else "available",
        "room_available": is_classroom_available(session["room"], session["time"]),
    }
