import sqlite3
from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_db
from app.api.models import StatLineCreate, StatLineUpdate, StatLineOut
from app.services.stat_service import (
    create_statline,
    update_statline,
    player_stats_for_game,
    get_statlines_for_game,
    upsert_statline,
    delete_statline
)
from app.api.auth_deps import get_current_user, require_admin

router = APIRouter(prefix="/stat-lines", tags=["Stat Lines"])

@router.get("/by-player/{player_id}/by-game/{game_id}", response_model=StatLineOut, dependencies=[Depends(get_current_user)])
def get_statline(player_id: int, game_id: int, conn=Depends(get_db)):
    row = player_stats_for_game(conn, player_id, game_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Stat line not found for player/game")
    return dict(row)

@router.post("/", response_model=dict, dependencies=[Depends(require_admin)])
def add_statline(payload: StatLineCreate, conn=Depends(get_db)):
    try:
        stat_id = create_statline(
            conn,
            payload.player_id,
            payload.game_id,
            minutes=payload.minutes,
            points=payload.points,
            rebounds=payload.rebounds,
            assists=payload.assists,
            steals=payload.steals,
            blocks=payload.blocks,
            turnovers=payload.turnovers,
            fouls=payload.fouls,
            FG=payload.FG,
            FGA=payload.FGA,
            FG3=payload.FG3,
            FGA3=payload.FGA3,
            FT=payload.FT,
            FTA=payload.FTA,
            PM=payload.PM,
            starter=payload.starter,
        )
        return {"stat_id": stat_id}
    except sqlite3.IntegrityError as e:
        raise HTTPException(status_code=409, detail=str(e))
    
@router.patch("/by-player/{player_id}/by-game/{game_id}", response_model=dict, dependencies=[Depends(require_admin)])
def patch_statline(player_id: int, game_id: int, payload: StatLineUpdate, conn=Depends(get_db)):
    try:
        updated = update_statline(
            conn,
            player_id,
            game_id,
            minutes=payload.minutes,
            points=payload.points,
            rebounds=payload.rebounds,
            assists=payload.assists,
            steals=payload.steals,
            blocks=payload.blocks,
            turnovers=payload.turnovers,
            fouls=payload.fouls,
            FG=payload.FG,
            FGA=payload.FGA,
            FG3=payload.FG3,
            FGA3=payload.FGA3,
            FT=payload.FT,
            FTA=payload.FTA,
            PM=payload.PM,
            starter=payload.starter,
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Stat line not found")
        return {"updated": True}
    except sqlite3.IntegrityError as e:
        raise HTTPException(status_code=409, detail=str(e))
    
@router.delete("/by-player/{player_id}/by-game/{game_id}", response_model=dict, dependencies=[Depends(require_admin)])
def remove_statline(player_id: int, game_id: int, conn=Depends(get_db)):
    deleted = delete_statline(conn, player_id, game_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Stat line not found")
    return {"deleted": True}

@router.get("/by-game/{game_id}", dependencies=[Depends(get_current_user)])
def list_statlines_for_game(game_id: int, conn=Depends(get_db)):
    rows = get_statlines_for_game(conn, game_id)
    return [dict(r) for r in rows]

@router.put("/upsert", dependencies=[Depends(require_admin)])
def upsert_statline_route(payload: dict, conn=Depends(get_db)):
    upsert_statline(
        conn,
        player_id=payload["player_id"],
        game_id=payload["game_id"],
        minutes=payload.get("minutes", 0),
        points=payload.get("points", 0),
        rebounds=payload.get("rebounds", 0),
        assists=payload.get("assists", 0),
        steals=payload.get("steals", 0),
        blocks=payload.get("blocks", 0),
        turnovers=payload.get("turnovers", 0),
        fouls=payload.get("fouls", 0),
        FG=payload.get("FG", 0),
        FGA=payload.get("FGA", 0),
        FG3=payload.get("FG3", 0),
        FGA3=payload.get("FGA3", 0),
        FT=payload.get("FT", 0),
        FTA=payload.get("FTA", 0),
        PM=payload.get("PM", 0),
        starter=payload.get("starter", 0),
    )
    return {"ok": True}
