import base64
import os
import json
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()

origins = [
    "http://localhost:5173",   # React dev server
    "http://127.0.0.1:5173"
]

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

EMOTIONS = [
    "happy", "sad", "angry", "surprised", "fearful", "disgusted", "neutral"
]

class PoemResponse(BaseModel):
    emotion: Literal["happy", "sad", "angry", "surprised", "fearful", "disgusted", "neutral"]
    confidence: float
    poem: str

SYSTEM_PROMPT = (
    "You are an expert affect-recognition assistant. Given a single face image, "
    "estimate the primary visible emotion among: happy, sad, angry, surprised, fearful, disgusted, neutral. "
    "Return a calibrated confidence in [0,1]. Then compose an original 6-8 line poem inspired by that emotion. "
    "Avoid describing the person's identity or attributes. Keep the poem PG and empathetic."
)

@app.post("/analyze", response_model=PoemResponse)
async def analyze(image: UploadFile = File(...)):
    # Read bytes and convert to data URL for the multimodal API
    img_bytes = await image.read()
    b64 = base64.b64encode(img_bytes).decode("utf-8")
    data_url = f"data:{image.content_type};base64,{b64}"

    # --- replace the whole `client.responses.create(...)` block with this: ---
    result = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Infer emotion from this image and write a poem."},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            },
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "poem_payload",
                "strict": True,  # enforce schema
                "schema": {
                    "type": "object",
                    "properties": {
                        "emotion": {"type": "string", "enum": EMOTIONS},
                        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                        "poem": {"type": "string"}
                    },
                    "required": ["emotion", "confidence", "poem"],
                    "additionalProperties": False
                }
            }
        },
    )

    # Parse structured output
    msg = result.choices[0].message
    # In chat completions, the model's output is a string payload that matches your schema:
    data = json.loads(msg.content)

    emo = data.get("emotion", "neutral")
    conf = float(max(0.0, min(1.0, data.get("confidence", 0.5))))
    poem = data.get("poem", "")
    return PoemResponse(emotion=emo, confidence=conf, poem=poem)


@app.get("/health")
async def health():
    return {"ok": True}
