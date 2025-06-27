import asyncio
import websockets
import json

clients = {}

async def broadcast_world_state():
    while True:
        world_state = {
            "type": "world_state",
            "players": [
                {"id": data["id"], "x": data["x"], "z": data["z"]}
                for data in clients.values()
            ]
        }
        for ws in clients:
            try:
                await ws.send(json.dumps(world_state))
            except:
                pass
        await asyncio.sleep(0.5)

async def handler(websocket):
    try:
        async for message in websocket:
            data = json.loads(message)

            if data["type"] == "join":
                user_id = f"{data['nom']}_{data['prenom']}"
                clients[websocket] = {"id": user_id, "x": 0, "z": 0}
                print(f"[+] {user_id} connecté")
                await websocket.send(json.dumps({"type": "state", "message": f"Bienvenue {user_id}"}))

            elif data["type"] == "move":
                if websocket in clients:
                    clients[websocket]["x"] = data["x"]
                    clients[websocket]["z"] = data["z"]
    except:
        pass
    finally:
        if websocket in clients:
            print(f"[-] {clients[websocket]['id']} déconnecté")
            del clients[websocket]

async def main():
    print("🚀 Serveur WebSocket sur ws://0.0.0.0:8765")
    asyncio.create_task(broadcast_world_state())
    async with websockets.serve(handler, "0.0.0.0", 8765):
        await asyncio.Future()

asyncio.run(main())
