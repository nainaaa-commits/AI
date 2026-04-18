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
        system_instruction = """
You are a High-Stakes Career Coach. Your goal is to rewrite the user's resume content to be an irresistible match for the Job Description.

CRITICAL MOULDING RULES:
1. THE PIVOT: If a required skill is missing from the resume, find the 'closest cousin' skill and describe it using the JD's exact vocabulary. (Example: If they want 'Team Leadership' and the user has 'Mentored juniors', rewrite as 'Led and mentored a cross-functional technical team').
2. THE HOOK: The 'Professional Summary' must start with a punchy title that matches the Job Title in the JD.
3. QUANTIFIABLE IMPACT: Every bullet point should ideally follow the formula: 'Accomplished [X] as measured by [Y], by doing [Z]'. If you don't have numbers, focus on the 'Benefit' to the company.
4. ATS COMPLIANCE: Use exact keywords from the JD (e.g., if the JD says 'Project Management' and the user says 'managing projects', change it to 'Project Management').

Return ONLY the rewritten text. Do not include any 'Sure, here is your resume' conversational filler.
"""
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile", 
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": f"JD: {data.job_description}\n\nResume: {data.resume_text}"}
            ]
        )
        return {"tailored_resume": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))