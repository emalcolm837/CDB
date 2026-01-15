from fastapi import APIRouter, Depends
from app.api.deps import get_db
from app.api.models import PlayerTotalsOut, PlayerAveragesOut
from app.analytics.player_analytics import get_player_totals, get_player_averages
from app.api.auth_deps import get_current_user
from app.services.analytics_service import player_totals_and_averages, leaders
from app.services.team_stats_service import (
    get_team_totals,
    get_team_averages,
    get_team_splits_totals,
    get_team_splits_averages,
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/players/{player_id}/totals", response_model=PlayerTotalsOut, dependencies=[Depends(get_current_user)])
def player_totals(player_id: int, conn=Depends(get_db)):
    row = get_player_totals(conn, player_id)
    return dict(row)

@router.get("/players/{player_id}/averages", response_model=PlayerAveragesOut, dependencies=[Depends(get_current_user)])
def player_averages(player_id: int, conn=Depends(get_db)):
    row = get_player_averages(conn, player_id)
    return dict(row)

@router.get("/players", dependencies=[Depends(get_current_user)])
def analytics_players(conn=Depends(get_db)):
    rows = player_totals_and_averages(conn)
    return [dict(r) for r in rows]

@router.get("/leaders", dependencies=[Depends(get_current_user)])
def analytics_leaders(conn=Depends(get_db), limit: int = 5):
    data = leaders(conn, limit=limit)
    return {
        "minutes": [dict(r) for r in data["minutes"]],
        "points": [dict(r) for r in data["points"]],
        "rebounds": [dict(r) for r in data["rebounds"]],
        "OREB": [dict(r) for r in data["OREB"]],
        "assists": [dict(r) for r in data["assists"]],
        "steals": [dict(r) for r in data["steals"]],
        "blocks": [dict(r) for r in data["blocks"]],
        "turnovers": [dict(r) for r in data["turnovers"]],
        "fouls": [dict(r) for r in data["fouls"]],
        "FG": [dict(r) for r in data["FG"]],
        "FGA": [dict(r) for r in data["FGA"]],
        "FG3": [dict(r) for r in data["FG3"]],
        "FGA3": [dict(r) for r in data["FGA3"]],
        "FT": [dict(r) for r in data["FT"]],
        "FTA": [dict(r) for r in data["FTA"]],
        "PM": [dict(r) for r in data["PM"]],
    }

@router.get("/team/totals", dependencies=[Depends(get_current_user)])
def team_totals(conn=Depends(get_db)):
    return get_team_totals(conn)

@router.get("/team/averages", dependencies=[Depends(get_current_user)])
def team_averages(conn=Depends(get_db)):
    return get_team_averages(conn)

@router.get("/team/splits/totals", dependencies=[Depends(get_current_user)])
def team_splits_totals(conn=Depends(get_db)):
    return get_team_splits_totals(conn)

@router.get("/team/splits/averages", dependencies=[Depends(get_current_user)])
def team_splits_averages(conn=Depends(get_db)):
    return get_team_splits_averages(conn)
