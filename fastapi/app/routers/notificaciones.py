from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from ..services.websocket_manager import manager

router = APIRouter(
    prefix="/notificaciones",
    tags=["Notificaciones"]
)

@router.websocket("/ws/{rol}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, rol: str, user_id: int):
    await manager.connect(websocket, rol)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, rol)
