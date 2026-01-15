from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_db
from app.api.models import PlayerCreate, PlayerOut
from app.services.player_service import create_player, get_all_players, get_player_by_id, delete_player
from app.services.stat_service import delete_statlines_for_player, get_game_log_for_player
from app.services.player_stats_service import (
    get_player_totals,
    get_player_averages,
    get_player_splits_totals,
    get_player_splits_averages,
)
from app.api.auth_deps import get_current_user, require_admin

router = APIRouter(prefix="/players", tags=["Players"])

#Decorator: modifies/enhances function. Tells FastAPI: when someone makes an HTTP GET request to /players/, run this function.
@router.get("/", response_model=list[PlayerOut], dependencies=[Depends(get_current_user)]) 
def list_players(conn=Depends(get_db)):
    players = get_all_players(conn)
    return [dict(player) for player in players]

@router.get("/{player_id}", response_model=PlayerOut, dependencies=[Depends(get_current_user)])
def read_player(player_id: int, conn=Depends(get_db)):
    player = get_player_by_id(conn, player_id)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return dict(player)

@router.get("/{player_id}/game-log", dependencies=[Depends(get_current_user)])
def player_game_log(player_id: int, conn=Depends(get_db)):
    player = get_player_by_id(conn, player_id)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    
    rows = get_game_log_for_player(conn, player_id)
    return [dict(r) for r in rows]

@router.get("/{player_id}/totals", dependencies=[Depends(get_current_user)])
def player_totals(player_id: int, conn=Depends(get_db)):
    player = get_player_by_id(conn, player_id)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    return get_player_totals(conn, player_id)

@router.get("/{player_id}/averages", dependencies=[Depends(get_current_user)])
def player_averages(player_id: int, conn=Depends(get_db)):
    player = get_player_by_id(conn, player_id)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    return get_player_averages(conn, player_id)

@router.get("/{player_id}/splits/totals", dependencies=[Depends(get_current_user)])
def player_splits_totals(player_id: int, conn=Depends(get_db)):
    player = get_player_by_id(conn, player_id)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    return get_player_splits_totals(conn, player_id)

@router.get("/{player_id}/splits/averages", dependencies=[Depends(get_current_user)])
def player_splits_averages(player_id: int, conn=Depends(get_db)):
    player = get_player_by_id(conn, player_id)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")

    return get_player_splits_averages(conn, player_id)

@router.post("/", response_model=dict, dependencies=[Depends(require_admin)])
def add_player(payload: PlayerCreate, conn=Depends(get_db)):
    player_id = create_player(conn, payload.name, payload.jersey_number, payload.position)
    return {"player_id": player_id}

@router.delete("/{player_id}", response_model=dict, dependencies=[Depends(require_admin)])
def remove_player(player_id: int, conn=Depends(get_db)):
    delete_statlines_for_player(conn, player_id)
    deleted = delete_player(conn, player_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Player not found")
    return {"deleted": True}
