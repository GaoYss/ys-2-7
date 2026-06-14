from flask import Blueprint, jsonify

from app.services.statistics import calculate_hour_stats


stats_bp = Blueprint("stats", __name__)


@stats_bp.get("/hours")
def hour_stats():
    return jsonify(calculate_hour_stats())
