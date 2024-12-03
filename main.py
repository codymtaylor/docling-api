from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse  # Import HTMLResponse
from document_converter.route import router as document_converter_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Mount the static files directory
app.mount("/static", StaticFiles(directory="public"), name="static")


# Serve the index.html at the root
@app.get("/",
         response_class=HTMLResponse)  # Set response_class to HTMLResponse
async def read_index():
    with open("public/index.html") as f:
        return f.read()


app.include_router(document_converter_router,
                   prefix="",
                   tags=["document-converter"])
