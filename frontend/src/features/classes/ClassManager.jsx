import { Plus, UserPlus } from "lucide-react";
import { useState } from "react";
import { SectionHeader } from "../../components/SectionHeader";
import { StatCard } from "../../components/StatCard";

const initialClass = {
  name: "",
  level: "入门",
  teacher: "",
  room: "",
  capacity: 24,
};

export function ClassManager({ classes, onCreateClass, onAddStudent }) {
  const [classForm, setClassForm] = useState(initialClass);
  const [studentForm, setStudentForm] = useState({ classId: "", name: "", phone: "" });

  const totalStudents = classes.reduce((sum, item) => sum + item.students.length, 0);
  const totalCapacity = classes.reduce((sum, item) => sum + item.capacity, 0);

  async function submitClass(event) {
    event.preventDefault();
    await onCreateClass(classForm);
    setClassForm(initialClass);
  }

  async function submitStudent(event) {
    event.preventDefault();
    if (!studentForm.classId) return;
    await onAddStudent(studentForm.classId, {
      name: studentForm.name,
      phone: studentForm.phone,
    });
    setStudentForm({ classId: "", name: "", phone: "" });
  }

  return (
    <section className="module">
      <div className="metrics-grid">
        <StatCard label="班级数" value={classes.length} helper="当前系统内班级" />
        <StatCard label="学员数" value={totalStudents} helper="已分配到班级" />
        <StatCard label="容量利用率" value={`${Math.round((totalStudents / totalCapacity) * 100) || 0}%`} helper="按班级容量计算" />
      </div>

      <div className="two-column">
        <form className="panel" onSubmit={submitClass}>
          <SectionHeader eyebrow="Class" title="新增班级" />
          <div className="form-grid">
            <label>
              班级名称
              <input
                required
                value={classForm.name}
                onChange={(event) => setClassForm({ ...classForm, name: event.target.value })}
                placeholder="例如 JavaScript 就业班"
              />
            </label>
            <label>
              阶段
              <select
                value={classForm.level}
                onChange={(event) => setClassForm({ ...classForm, level: event.target.value })}
              >
                <option>入门</option>
                <option>进阶</option>
                <option>就业</option>
              </select>
            </label>
            <label>
              讲师
              <input
                required
                value={classForm.teacher}
                onChange={(event) => setClassForm({ ...classForm, teacher: event.target.value })}
              />
            </label>
            <label>
              教室
              <input
                required
                value={classForm.room}
                onChange={(event) => setClassForm({ ...classForm, room: event.target.value })}
              />
            </label>
            <label>
              容量
              <input
                min="1"
                type="number"
                value={classForm.capacity}
                onChange={(event) => setClassForm({ ...classForm, capacity: event.target.value })}
              />
            </label>
          </div>
          <button className="primary-action" type="submit">
            <Plus size={18} />
            创建班级
          </button>
        </form>

        <form className="panel" onSubmit={submitStudent}>
          <SectionHeader eyebrow="Student" title="添加学员" />
          <div className="form-grid">
            <label>
              所属班级
              <select
                required
                value={studentForm.classId}
                onChange={(event) => setStudentForm({ ...studentForm, classId: event.target.value })}
              >
                <option value="">选择班级</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              学员姓名
              <input
                required
                value={studentForm.name}
                onChange={(event) => setStudentForm({ ...studentForm, name: event.target.value })}
              />
            </label>
            <label>
              手机号
              <input
                value={studentForm.phone}
                onChange={(event) => setStudentForm({ ...studentForm, phone: event.target.value })}
              />
            </label>
          </div>
          <button className="primary-action" type="submit">
            <UserPlus size={18} />
            添加学员
          </button>
        </form>
      </div>

      <div className="table-panel">
        <SectionHeader eyebrow="Roster" title="班级列表" />
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>班级</th>
                <th>阶段</th>
                <th>讲师</th>
                <th>教室</th>
                <th>人数</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <small>{item.students.map((student) => student.name).join("、")}</small>
                  </td>
                  <td>{item.level}</td>
                  <td>{item.teacher}</td>
                  <td>{item.room}</td>
                  <td>
                    {item.students.length}/{item.capacity}
                  </td>
                  <td>
                    <span className="status-pill">{item.status}</span>
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
