from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from ..services.websocket_manager import manager

router = APIRouter(
    prefix="/notificaciones",
    tags=["Notificaciones"]
)

@router.websocket("/ws/{rol}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, rol: str, user_id: int):
    # Conectamos al usuario a la sala (rol) correspondiente
    await manager.connect(websocket, rol)
    try:
        while True:
            # Mantener la conexion abierta. El cliente puede mandar pings si lo desea.
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, rol)
