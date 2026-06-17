import { CalendarPlus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { SectionHeader } from "../../components/SectionHeader";

export function ScheduleBoard({
  classes,
  classrooms,
  courses,
  schedule,
  onGenerate,
  onReassignSingle,
  onReassignAll,
}) {
  const [classId, setClassId] = useState("");
  const [days, setDays] = useState(8);
  const [reassigningId, setReassigningId] = useState(null);
  const [reassigningAll, setReassigningAll] = useState(false);

  async function submit(event) {
    event.preventDefault();
    await onGenerate({ class_id: classId || undefined, days });
  }

  async function handleReassignSingle(sessionId) {
    setReassigningId(sessionId);
    try {
      await onReassignSingle(sessionId);
    } finally {
      setReassigningId(null);
    }
  }

  async function handleReassignAll() {
    setReassigningAll(true);
    try {
      await onReassignAll();
    } finally {
      setReassigningAll(false);
    }
  }

  const needsReassignCount = schedule.filter((s) => s.needs_reassign).length;

  return (
    <section className="module">
      <form className="toolbar-panel" onSubmit={submit}>
        <label>
          排课班级
          <select value={classId} onChange={(event) => setClassId(event.target.value)}>
            <option value="">全部班级</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          生成课次数
          <input
            min="1"
            max="30"
            type="number"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          />
        </label>
        <button className="primary-action" type="submit">
          <CalendarPlus size={18} />
          自动生成课程表
        </button>
        {needsReassignCount > 0 && (
          <button
            className="secondary-action"
            type="button"
            onClick={handleReassignAll}
            disabled={reassigningAll}
          >
            <RefreshCw size={18} className={reassigningAll ? "spin" : ""} />
            重新分配 {needsReassignCount} 个需要调整的课次
          </button>
        )}
      </form>

      <div className="table-panel">
        <SectionHeader eyebrow="Schedule" title="课程表" />
        <div className="schedule-grid">
          {schedule.map((session) => (
            <article
              className={`schedule-card ${session.needs_reassign ? "room-unavailable" : ""}`}
              key={session.id}
            >
              <span>{session.date}</span>
              <h3>{session.course_title}</h3>
              <p>{session.class_name}</p>
              <div>
                <small>{session.time}</small>
                <small>{session.room}</small>
                <small>{session.teacher}</small>
              </div>
              {session.needs_reassign && (
                <div className="room-warning">
                  ⚠️ {session.reassign_reason}
                </div>
              )}
              {!session.needs_reassign && session.room_capacity !== null && (
                <div className="capacity-info">
                  容量：{session.class_size}/{session.room_capacity}人
                </div>
              )}
              <button
                className="reassign-button"
                type="button"
                onClick={() => handleReassignSingle(session.id)}
                disabled={reassigningId === session.id}
                title="重新分配"
              >
                <RefreshCw size={14} className={reassigningId === session.id ? "spin" : ""} />
                {reassigningId === session.id ? "分配中..." : "重新分配"}
              </button>
            </article>
          ))}
        </div>
      </div>

      <div className="table-panel">
        <SectionHeader eyebrow="Courses" title="课程库" />
        <div className="course-tags">
          {courses.map((course) => (
            <span key={course.id}>
              {course.title} · {course.duration}课时 · {course.category}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
