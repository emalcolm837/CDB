from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_db
from app.api.models import GameCreate, GameOut
from app.services.game_service import create_game, get_all_games, get_game_by_id, delete_game
from app.services.stat_service import delete_statlines_for_game
from app.api.auth_deps import get_current_user, require_admin

router = APIRouter(prefix="/games", tags=["Games"])

@router.get("/", response_model=list[GameOut], dependencies=[Depends(get_current_user)])
def list_games(conn=Depends(get_db)):
    games = get_all_games(conn)
    return [dict(g) for g in games]

@router.get("/{game_id}", response_model=GameOut, dependencies=[Depends(get_current_user)])
def read_game(game_id: int, conn=Depends(get_db)):
    game = get_game_by_id(conn, game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    return dict(game)

@router.post("/", response_model=dict, dependencies=[Depends(require_admin)])
def add_game(payload: GameCreate, conn=Depends(get_db)):
    game_id = create_game(conn, payload.date, payload.opponent, payload.location)
    if game_id is None:
        raise HTTPException(status_code=409, detail="Game already exists")
    return {"game_id": game_id}

@router.delete("/{game_id}", response_model=dict, dependencies=[Depends(require_admin)])
def remove_game(game_id: int, conn=Depends(get_db)):
    delete_statlines_for_game(conn, game_id)
    deleted = delete_game(conn, game_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Game not found")
    return {"deleted": True}