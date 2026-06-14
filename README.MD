# Flask + React 培训机构排课系统

一个前后端分离的培训机构排课系统，覆盖班级管理、课程表生成、学员考勤和课时统计。项目按模块拆分，避免把业务逻辑集中在单个页面或单个接口文件。

## 功能

- 班级管理：创建班级、维护讲师/教室/容量、添加学员。
- 课程表生成：按班级自动生成未来工作日课次，关联课程、讲师和教室。
- 学员考勤：按课次记录出勤、迟到、请假、缺勤。
- 课时统计：按班级汇总已排课时、应到总课时、有效出勤课时和出勤率。

## 项目结构

```text
backend/
  app/
    data/            # 内存数据仓库与演示数据
    routes/          # Flask Blueprint API 模块
    services/        # 排课和统计业务逻辑
  run.py
  requirements.txt
frontend/
  src/
    components/      # 通用 UI 组件
    features/        # 按业务域拆分的页面模块
    services/        # API 调用封装
    styles/
docker-compose.yml
```

## 本地运行

### Docker Compose

```bash
docker compose up --build
```

- 前端：http://127.0.0.1:5173
- 后端健康检查：http://127.0.0.1:5000/api/health

### 手动启动

后端：

```bash
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python run.py
```

前端：

```bash
cd frontend
npm install
npm run dev
```

## API 摘要

- `GET /api/classes`：班级列表
- `POST /api/classes`：创建班级
- `POST /api/classes/<class_id>/students`：添加学员
- `GET /api/courses`：课程库
- `GET /api/schedule`：课程表
- `POST /api/schedule/generate`：自动排课
- `GET /api/attendance`：考勤记录
- `POST /api/attendance`：保存考勤
- `GET /api/stats/hours`：课时统计

当前版本使用内存数据，适合开发培训和功能演示；如需生产化，可替换 `backend/app/data/store.py` 为数据库模型与持久化层。
