import os
import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

router = APIRouter()

MAGI_URL = os.environ.get("MAGI_AGENT_URL", "http://127.0.0.1:8888")


async def call_magi(path: str):
    """Faz um GET ao agente magi e devolve o resultado."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            r = await c.get(f"{MAGI_URL}{path}")
            r.raise_for_status()
            return r.json()
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="nerv-update-agent unreachable")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e))


@router.get("/health")
async def agent_health():
    """Estado do agente magi."""
    return await call_magi("/health")


@router.get("/")
async def list_apps():
    """Lista todas as apps geridas pelo agente."""
    return await call_magi("/apps")


@router.get("/{app_name}/info")
async def app_info(app_name: str):
    """Digest local + GitHub latest release de uma app."""
    return await call_magi(f"/apps/{app_name}/info")


@router.get("/all/info")
async def all_apps_info():
    """Info de todas as apps em paralelo."""
    import asyncio

    apps = ["jellyfin", "sonarr", "radarr", "bazarr", "prowlarr", "transmission", "filebrowser"]

    async def fetch_info(app: str):
        try:
            return await call_magi(f"/apps/{app}/info")
        except Exception:
            return {"name": app, "error": "unreachable"}

    results = await asyncio.gather(*[fetch_info(app) for app in apps])
    return {"apps": list(results)}


@router.post("/{app_name}/update")
async def trigger_update(app_name: str):
    """Inicia o update de uma app com SSE streaming."""
    try:
        client = httpx.AsyncClient(timeout=None)

        async def event_stream():
            try:
                async with client.stream("POST", f"{MAGI_URL}/apps/{app_name}/update") as r:
                    async for line in r.aiter_lines():
                        if line:
                            yield f"{line}\n\n"
            except Exception as e:
                yield f"data: [ERROR] {str(e)}\n\n"
            finally:
                await client.aclose()

        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/logs")
async def get_logs(app: str = None, limit: int = 50):
    """Activity log do agente magi."""
    path = f"/logs?limit={limit}"
    if app:
        path += f"&app={app}"
    return await call_magi(path)
