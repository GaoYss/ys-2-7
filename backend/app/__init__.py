from flask import Flask
from flask_cors import CORS

from .routes.attendance import attendance_bp
from .routes.classes import classes_bp
from .routes.courses import courses_bp
from .routes.health import health_bp
from .routes.schedule import schedule_bp
from .routes.stats import stats_bp


def create_app():
    app = Flask(__name__)
    CORS(app)

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(classes_bp, url_prefix="/api/classes")
    app.register_blueprint(courses_bp, url_prefix="/api/courses")
    app.register_blueprint(schedule_bp, url_prefix="/api/schedule")
    app.register_blueprint(attendance_bp, url_prefix="/api/attendance")
    app.register_blueprint(stats_bp, url_prefix="/api/stats")

    return app
