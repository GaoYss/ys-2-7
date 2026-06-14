import { CalendarPlus } from "lucide-react";
import { useState } from "react";
import { SectionHeader } from "../../components/SectionHeader";

export function ScheduleBoard({ classes, courses, schedule, onGenerate }) {
  const [classId, setClassId] = useState("");
  const [days, setDays] = useState(8);

  async function submit(event) {
    event.preventDefault();
    await onGenerate({ class_id: classId || undefined, days });
  }

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
      </form>

      <div className="table-panel">
        <SectionHeader eyebrow="Schedule" title="课程表" />
        <div className="schedule-grid">
          {schedule.map((session) => (
            <article className="schedule-card" key={session.id}>
              <span>{session.date}</span>
              <h3>{session.course_title}</h3>
              <p>{session.class_name}</p>
              <div>
                <small>{session.time}</small>
                <small>{session.room}</small>
                <small>{session.teacher}</small>
              </div>
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
