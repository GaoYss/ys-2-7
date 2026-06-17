import { useEffect, useMemo, useState } from "react";
import { Building2, CalendarDays, ClipboardCheck, GraduationCap, Users } from "lucide-react";
import { api } from "./services/api";
import { ClassManager } from "./features/classes/ClassManager";
import { ClassroomManager } from "./features/classrooms/ClassroomManager";
import { ScheduleBoard } from "./features/schedule/ScheduleBoard";
import { AttendancePanel } from "./features/attendance/AttendancePanel";
import { HourStats } from "./features/stats/HourStats";

const tabs = [
  { id: "classes", label: "班级管理", icon: Users },
  { id: "classrooms", label: "教室管理", icon: Building2 },
  { id: "schedule", label: "课程表", icon: CalendarDays },
  { id: "attendance", label: "学员考勤", icon: ClipboardCheck },
  { id: "stats", label: "课时统计", icon: GraduationCap },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("classes");
  const [classes, setClasses] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const studentMap = useMemo(() => {
    const map = new Map();
    classes.forEach((item) => {
      item.students.forEach((student) => {
        map.set(student.id, { ...student, className: item.name });
      });
    });
    return map;
  }, [classes]);

  async function refreshAll() {
    setError("");
    const [classData, classroomData, courseData, scheduleData, attendanceData, statsData] =
      await Promise.all([
        api.getClasses(),
        api.getClassrooms(),
        api.getCourses(),
        api.getSchedule(),
        api.getAttendance(),
        api.getHourStats(),
      ]);
    setClasses(classData);
    setClassrooms(classroomData);
    setCourses(courseData);
    setSchedule(scheduleData);
    setAttendance(attendanceData);
    setStats(statsData);
  }

  useEffect(() => {
    refreshAll()
      .catch(() => setError("后端服务暂不可用，请确认 Flask API 已启动。"))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreateClass(payload) {
    await api.createClass(payload);
    await refreshAll();
  }

  async function handleAddStudent(classId, payload) {
    await api.addStudent(classId, payload);
    await refreshAll();
  }

  async function handleGenerateSchedule(payload) {
    await api.generateSchedule(payload);
    await refreshAll();
  }

  async function handleRecordAttendance(payload) {
    await api.recordAttendance(payload);
    await refreshAll();
  }

  async function handleCreateClassroom(payload) {
    await api.createClassroom(payload);
    await refreshAll();
  }

  async function handleUpdateClassroom(id, payload) {
    await api.updateClassroom(id, payload);
    await refreshAll();
  }

  async function handleDeleteClassroom(id) {
    await api.deleteClassroom(id);
    await refreshAll();
  }

  async function handleReassignSingle(sessionId) {
    try {
      await api.reassignSingleSession(sessionId);
      await refreshAll();
    } catch (error) {
      alert("重新分配失败：没有找到可用的教室和时段");
    }
  }

  async function handleReassignAll() {
    try {
      const result = await api.reassignSessions({});
      await refreshAll();
      if (result && result.length > 0) {
        alert(`成功重新分配 ${result.length} 个课次`);
      } else {
        alert("没有需要重新分配的课次");
      }
    } catch (error) {
      alert("重新分配失败");
    }
  }

  async function handleReassignClassroom(classroomName) {
    try {
      const result = await api.reassignSessions({ classroom_name: classroomName });
      await refreshAll();
      if (result && result.length > 0) {
        alert(`成功重新分配 ${result.length} 个课次`);
      } else {
        alert("该教室没有需要重新分配的课次");
      }
    } catch (error) {
      alert("重新分配失败");
    }
  }

  const ActiveIcon = tabs.find((tab) => tab.id === activeTab)?.icon || Users;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <GraduationCap size={28} />
          <div>
            <strong>培训机构排课系统</strong>
            <span>ClassOps</span>
          </div>
        </div>
        <nav className="nav-tabs" aria-label="主要模块">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={activeTab === tab.id ? "active" : ""}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Training Scheduler</span>
            <h1>
              <ActiveIcon size={30} />
              {tabs.find((tab) => tab.id === activeTab)?.label}
            </h1>
          </div>
          <button className="secondary-action" onClick={refreshAll} type="button">
            刷新数据
          </button>
        </header>

        {error && <div className="notice error">{error}</div>}
        {loading ? (
          <div className="notice">加载业务数据中...</div>
        ) : (
          <>
            {activeTab === "classes" && (
              <ClassManager
                classes={classes}
                classrooms={classrooms}
                onCreateClass={handleCreateClass}
                onAddStudent={handleAddStudent}
              />
            )}
            {activeTab === "classrooms" && (
              <ClassroomManager
                classrooms={classrooms}
                classes={classes}
                schedule={schedule}
                onCreateClassroom={handleCreateClassroom}
                onUpdateClassroom={handleUpdateClassroom}
                onDeleteClassroom={handleDeleteClassroom}
                onReassignClassroom={handleReassignClassroom}
              />
            )}
            {activeTab === "schedule" && (
              <ScheduleBoard
                classes={classes}
                classrooms={classrooms}
                courses={courses}
                schedule={schedule}
                onGenerate={handleGenerateSchedule}
                onReassignSingle={handleReassignSingle}
                onReassignAll={handleReassignAll}
              />
            )}
            {activeTab === "attendance" && (
              <AttendancePanel
                schedule={schedule}
                classes={classes}
                attendance={attendance}
                studentMap={studentMap}
                onRecord={handleRecordAttendance}
              />
            )}
            {activeTab === "stats" && <HourStats stats={stats} />}
          </>
        )}
      </main>
    </div>
  );
}
