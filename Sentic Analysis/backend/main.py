from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from nltk.sentiment.vader import SentimentIntensityAnalyzer
import nltk

origins = [
    "http://localhost:5173",                 # Local development
    "https://sentic-face-ui.onrender.com/" # LIVE frontend URL
]
 
# 1. Initialize the AI Brain (Lexicon)
# downloads the 'dictionary' of emotional words
nltk.download('vader_lexicon')

app = FastAPI(
    title="Sentic-Analyzer",
    description="Professional NLP service for real-time sentiment analysis.",
    version="1.0.0"
)

# 2. Enable CORS (The Bridge to your Frontend)
#  allows React app to talk to Python app
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Define the Data Rules (Pydantic Models)
class AnalysisRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000, example="I love building AI apps!")

class SentimentResponse(BaseModel):
    label: str
    score: float
    distribution: dict

# Initialize the Analyzer
sia = SentimentIntensityAnalyzer()

# 4. The API Endpoint
@app.post("/api/v1/analyze", response_model=SentimentResponse)
async def analyze_sentiment(request: AnalysisRequest):
    # Perform the AI calculation
    scores = sia.polarity_scores(request.text)
    compound = scores['compound']
    
    # Logic to classify the 'Vibe'
    if compound >= 0.05:
        label = "Positive"
    elif compound <= -0.05:
        label = "Negative"
    else:
        label = "Neutral"
        
    return {
        "label": label,
        "score": round(compound, 4),
        "distribution": {
            "positive": scores['pos'],
            "neutral": scores['neu'],
            "negative": scores['neg']
        }
    }

# 'Health Check' endpoint
@app.get("/")
def home():
    return {"status": "Sentic-API is online and healthy"}