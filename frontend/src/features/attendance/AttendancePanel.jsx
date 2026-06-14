import { CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { SectionHeader } from "../../components/SectionHeader";

const statusLabels = {
  present: "出勤",
  late: "迟到",
  leave: "请假",
  absent: "缺勤",
};

export function AttendancePanel({ schedule, classes, attendance, studentMap, onRecord }) {
  const [sessionId, setSessionId] = useState(schedule[0]?.id || "");
  const [studentId, setStudentId] = useState("");
  const [status, setStatus] = useState("present");

  const selectedSession = schedule.find((item) => item.id === Number(sessionId));
  const students = useMemo(() => {
    if (!selectedSession) return [];
    return (
      classes.find((item) => item.id === selectedSession.class_id)?.students || []
    );
  }, [classes, selectedSession]);

  async function submit(event) {
    event.preventDefault();
    if (!sessionId || !studentId) return;
    await onRecord({
      session_id: Number(sessionId),
      student_id: Number(studentId),
      status,
    });
    setStudentId("");
  }

  return (
    <section className="module">
      <form className="toolbar-panel" onSubmit={submit}>
        <label>
          课次
          <select value={sessionId} onChange={(event) => setSessionId(event.target.value)}>
            {schedule.map((item) => (
              <option key={item.id} value={item.id}>
                {item.date} · {item.class_name} · {item.course_title}
              </option>
            ))}
          </select>
        </label>
        <label>
          学员
          <select value={studentId} onChange={(event) => setStudentId(event.target.value)}>
            <option value="">选择学员</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          状态
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button className="primary-action" type="submit">
          <CheckCircle2 size={18} />
          保存考勤
        </button>
      </form>

      <div className="table-panel">
        <SectionHeader eyebrow="Attendance" title="考勤记录" />
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>课程</th>
                <th>学员</th>
                <th>班级</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record) => {
                const session = schedule.find((item) => item.id === record.session_id);
                const student = studentMap.get(record.student_id);
                return (
                  <tr key={record.id}>
                    <td>{session?.course_title || "未知课程"}</td>
                    <td>{student?.name || "未知学员"}</td>
                    <td>{student?.className || session?.class_name || "-"}</td>
                    <td>
                      <span className={`status-pill ${record.status}`}>
                        {statusLabels[record.status] || record.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
