import os
from openai import OpenAI
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

# We use the Groq endpoint but the OpenAI library
client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.getenv("GROQ_API_KEY")
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TailorRequest(BaseModel):
    resume_text: str
    job_description: str

@app.post("/tailor")
async def tailor_resume(data: TailorRequest):
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile", # One of the best free models available
            messages=[
                {"role": "system", "content": "You are a professional resume writer. Rewrite the user's resume bullet points to match the job description terminology."},
                {"role": "user", "content": f"JD: {data.job_description}\n\nResume: {data.resume_text}"}
            ]
        )
        return {"tailored_resume": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))