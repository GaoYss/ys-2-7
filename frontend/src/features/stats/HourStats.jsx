import { SectionHeader } from "../../components/SectionHeader";
import { StatCard } from "../../components/StatCard";

export function HourStats({ stats }) {
  const totalPlanned = stats.reduce((sum, item) => sum + item.planned_hours, 0);
  const totalAttended = stats.reduce((sum, item) => sum + item.attended_hours, 0);
  const avgRate = stats.length
    ? Math.round(stats.reduce((sum, item) => sum + item.attendance_rate, 0) / stats.length)
    : 0;

  return (
    <section className="module">
      <div className="metrics-grid">
        <StatCard label="已排课时" value={totalPlanned} helper="按课程时长汇总" />
        <StatCard label="有效出勤课时" value={totalAttended} helper="迟到与请假折算" />
        <StatCard label="平均出勤率" value={`${avgRate}%`} helper="按班级平均" />
      </div>

      <div className="table-panel">
        <SectionHeader eyebrow="Hours" title="班级课时统计" />
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>班级</th>
                <th>学员数</th>
                <th>已排课时</th>
                <th>应到总课时</th>
                <th>有效出勤课时</th>
                <th>出勤率</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((item) => (
                <tr key={item.class_id}>
                  <td>
                    <strong>{item.class_name}</strong>
                  </td>
                  <td>{item.student_count}</td>
                  <td>{item.planned_hours}</td>
                  <td>{item.expected_total_hours}</td>
                  <td>{item.attended_hours}</td>
                  <td>
                    <span className="status-pill">{item.attendance_rate}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
