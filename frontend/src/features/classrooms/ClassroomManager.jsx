import { Edit2, Plus, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import { SectionHeader } from "../../components/SectionHeader";
import { StatCard } from "../../components/StatCard";

const TIME_SLOT_OPTIONS = ["09:00-11:00", "14:00-16:00", "19:00-21:00"];

const initialClassroom = {
  name: "",
  capacity: 20,
  available_times: ["09:00-11:00", "14:00-16:00", "19:00-21:00"],
  status: "available",
};

export function ClassroomManager({
  classrooms,
  classes,
  schedule,
  onCreateClassroom,
  onUpdateClassroom,
  onDeleteClassroom,
}) {
  const [form, setForm] = useState(initialClassroom);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const availableCount = classrooms.filter((c) => c.status === "available").length;
  const disabledCount = classrooms.filter((c) => c.status === "disabled").length;
  const totalCapacity = classrooms.reduce((sum, c) => sum + c.capacity, 0);

  function getClassroomUsage(classroomName) {
    const classCount = classes.filter((c) => c.room === classroomName).length;
    const sessionCount = schedule.filter((s) => s.room === classroomName).length;
    return { classCount, sessionCount };
  }

  async function submitCreate(event) {
    event.preventDefault();
    if (!form.name) return;
    await onCreateClassroom(form);
    setForm(initialClassroom);
  }

  function startEdit(classroom) {
    setEditingId(classroom.id);
    setEditForm({ ...classroom });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!editForm || !editForm.name) return;
    await onUpdateClassroom(editingId, editForm);
    setEditingId(null);
    setEditForm(null);
  }

  function toggleTimeSlot(slot, isEdit = false) {
    if (isEdit && editForm) {
      const current = editForm.available_times.includes(slot)
        ? editForm.available_times.filter((t) => t !== slot)
        : [...editForm.available_times, slot];
      setEditForm({ ...editForm, available_times: current });
    } else {
      const current = form.available_times.includes(slot)
        ? form.available_times.filter((t) => t !== slot)
        : [...form.available_times, slot];
      setForm({ ...form, available_times: current });
    }
  }

  async function handleDelete(classroom) {
    const usage = getClassroomUsage(classroom.name);
    if (usage.classCount > 0 || usage.sessionCount > 0) {
      alert("该教室已被使用，无法删除。请先将相关班级和课次分配到其他教室。");
      return;
    }
    if (window.confirm(`确定要删除教室 ${classroom.name} 吗？`)) {
      await onDeleteClassroom(classroom.id);
    }
  }

  return (
    <section className="module">
      <div className="metrics-grid">
        <StatCard label="教室总数" value={classrooms.length} helper="系统内所有教室" />
        <StatCard label="可用教室" value={availableCount} helper="正常使用中" />
        <StatCard label="停用教室" value={disabledCount} helper="暂时不可用" />
        <StatCard label="总容量" value={totalCapacity} helper="所有教室座位数" />
      </div>

      <div className="two-column">
        <form className="panel" onSubmit={submitCreate}>
          <SectionHeader eyebrow="Classroom" title="新增教室" />
          <div className="form-grid">
            <label>
              教室名称
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例如 A-201"
              />
            </label>
            <label>
              容量
              <input
                min="1"
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              />
            </label>
            <label>
              状态
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="available">可用</option>
                <option value="disabled">停用</option>
              </select>
            </label>
          </div>
          <div className="form-grid">
            <label className="full-width">
              可用时段
              <div className="time-slots">
                {TIME_SLOT_OPTIONS.map((slot) => (
                  <label key={slot} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.available_times.includes(slot)}
                      onChange={() => toggleTimeSlot(slot)}
                    />
                    {slot}
                  </label>
                ))}
              </div>
            </label>
          </div>
          <button className="primary-action" type="submit">
            <Plus size={18} />
            创建教室
          </button>
        </form>

        <div className="panel">
          <SectionHeader eyebrow="Tips" title="使用说明" />
          <ul className="tips-list">
            <li>停用状态的教室在自动排课时会被自动避开</li>
            <li>可用时段限制了教室可以排课的时间段</li>
            <li>已被班级或课次使用的教室无法删除</li>
            <li>修改教室状态不影响已生成的课次</li>
          </ul>
        </div>
      </div>

      <div className="table-panel">
        <SectionHeader eyebrow="List" title="教室列表" />
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>教室</th>
                <th>容量</th>
                <th>可用时段</th>
                <th>使用情况</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {classrooms.map((classroom) => {
                const usage = getClassroomUsage(classroom.name);
                const isEditing = editingId === classroom.id;
                const data = isEditing ? editForm : classroom;

                return (
                  <tr key={classroom.id}>
                    {isEditing ? (
                      <>
                        <td>
                          <input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            value={editForm.capacity}
                            onChange={(e) => setEditForm({ ...editForm, capacity: Number(e.target.value) })}
                          />
                        </td>
                        <td>
                          <div className="time-slots">
                            {TIME_SLOT_OPTIONS.map((slot) => (
                              <label key={slot} className="checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={editForm.available_times.includes(slot)}
                                  onChange={() => toggleTimeSlot(slot, true)}
                                />
                                {slot}
                              </label>
                            ))}
                          </div>
                        </td>
                        <td>
                          {usage.classCount} 个班级 / {usage.sessionCount} 节课
                        </td>
                        <td>
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          >
                            <option value="available">可用</option>
                            <option value="disabled">停用</option>
                          </select>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="icon-button"
                              onClick={submitEdit}
                              type="button"
                              title="保存"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              className="icon-button"
                              onClick={cancelEdit}
                              type="button"
                              title="取消"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <strong>{data.name}</strong>
                        </td>
                        <td>{data.capacity} 人</td>
                        <td>
                          <div className="time-slot-tags">
                            {data.available_times.map((slot) => (
                              <span key={slot} className="tag">{slot}</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          {usage.classCount} 个班级 / {usage.sessionCount} 节课
                        </td>
                        <td>
                          <span className={`status-pill ${data.status}`}>
                            {data.status === "available" ? "可用" : "停用"}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="icon-button"
                              onClick={() => startEdit(classroom)}
                              type="button"
                              title="编辑"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="icon-button danger"
                              onClick={() => handleDelete(classroom)}
                              type="button"
                              title="删除"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
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
