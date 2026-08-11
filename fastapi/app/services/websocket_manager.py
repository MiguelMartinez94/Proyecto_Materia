import json
from fastapi import WebSocket
from typing import Dict, List, Any

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {
            "MESERO": [],
            "CAJERO": [],
            "COCINERO": [],
            "ADMINISTRADOR": []
        }

    async def connect(self, websocket: WebSocket, rol: str):
        await websocket.accept()
        rol = rol.upper()
        if rol not in self.active_connections:
            self.active_connections[rol] = []
        self.active_connections[rol].append(websocket)
        print(f"[{rol}] WebSocket conectado. Total: {len(self.active_connections[rol])}")

    def disconnect(self, websocket: WebSocket, rol: str):
        rol = rol.upper()
        if rol in self.active_connections and websocket in self.active_connections[rol]:
            self.active_connections[rol].remove(websocket)
            print(f"[{rol}] WebSocket desconectado. Total: {len(self.active_connections[rol])}")

    async def broadcast(self, message: dict, rol: str):
        rol = rol.upper()
        if rol in self.active_connections:
            # We iterate over a copy of the list to avoid issues if a connection drops during broadcast
            connections = list(self.active_connections[rol])
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error enviando mensaje WS al rol {rol}: {e}")
                    self.disconnect(connection, rol)

# Instancia global
manager = ConnectionManager()
