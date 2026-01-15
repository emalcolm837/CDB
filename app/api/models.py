from pydantic import BaseModel
from typing import Optional

# ----- Players ------

class PlayerCreate(BaseModel):
    name: str
    jersey_number: Optional[int] = None
    position: Optional[str] = None

class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    jersey_number: Optional[int] = None
    position: Optional[str] = None

class PlayerOut(BaseModel):
    id: int
    name: str
    jersey_number: Optional[int] = None
    position: Optional[str] = None

# ----- Games ------

class GameCreate(BaseModel):
    date: str
    opponent: str
    location: Optional[str] = None

class GameOut(BaseModel):
    id: int
    date: str
    opponent: str
    location: Optional[str] = None 

# ----- Stats ------

class StatLineCreate(BaseModel):
    player_id: int
    game_id: int
    minutes: int = 0
    points: int = 0
    rebounds: int = 0
    assists: int = 0
    steals: int = 0
    blocks: int = 0
    turnovers: int = 0
    fouls: int = 0
    FG: int = 0
    FGA: int = 0
    FG3: int = 0
    FGA3: int = 0
    FT: int = 0
    FTA: int = 0
    PM: int = 0
    starter: int = 0

class StatLineUpdate(BaseModel):
    minutes: Optional[int] = None
    points: Optional[int] = None
    rebounds: Optional[int] = None
    assists: Optional[int] = None
    steals: Optional[int] = None
    blocks: Optional[int] = None
    turnovers: Optional[int] = None
    fouls: Optional[int] = None
    FG: Optional[int] = None
    FGA: Optional[int] = None
    FG3: Optional[int] = None
    FGA3: Optional[int] = None
    FT: Optional[int] = None
    FTA: Optional[int] = None
    PM: Optional[int] = None
    starter: Optional[int] = None

class StatLineOut(BaseModel):
    id: int
    player_id: int
    game_id: int
    minutes: int = 0
    points: int = 0
    rebounds: int = 0
    assists: int = 0
    steals: int = 0
    blocks: int = 0
    turnovers: int = 0
    fouls: int = 0
    FG: int = 0
    FGA: int = 0
    FG3: int = 0
    FGA3: int = 0
    FT: int = 0
    FTA: int = 0
    PM: int = 0
    starter: int = 0

# ----- Analytics ------

class PlayerTotalsOut(BaseModel):
    games_played: int
    total_minutes: Optional[int] = None
    total_points: Optional[int] = None
    total_rebounds: Optional[int] = None
    total_assists: Optional[int] = None
    total_steals: Optional[int] = None
    total_blocks: Optional[int] = None
    total_turnovers: Optional[int] = None
    total_fouls: Optional[int] = None
    total_FG: Optional[int] = None
    total_FGA: Optional[int] = None
    total_FG3: Optional[int] = None
    total_FGA3: Optional[int] = None
    total_FT: Optional[int] = None
    total_FTA: Optional[int] = None
    total_PM: Optional[int] = None

class PlayerAveragesOut(BaseModel):
    avg_minutes: Optional[float] = None
    avg_points: Optional[float] = None
    avg_rebounds: Optional[float] = None
    avg_assists: Optional[float] = None
    avg_steals: Optional[float] = None
    avg_blocks: Optional[float] = None
    avg_turnovers: Optional[float] = None
    avg_fouls: Optional[float] = None
    avg_FG: Optional[float] = None
    avg_FGA: Optional[float] = None
    avg_FG3: Optional[float] = None
    avg_FGA3: Optional[float] = None
    avg_FT: Optional[float] = None
    avg_FTA: Optional[float] = None
    avg_PM: Optional[float] = None
