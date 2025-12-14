import { useState } from "react";

interface SentimentData {
  label: string;
  score: number;
  distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export default function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      alert(
        "Backend service unreachable. Ensure FastAPI is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      <header className="max-w-4xl mx-auto mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-blue-500">
            SENTIC<span className="text-slate-100">.Analyzer</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">
            Neural Sentiment Analysis
          </p>
        </div>
      </header>

      <main className="max-w-xl mx-auto space-y-8">
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          <textarea
            className="w-full h-40 bg-transparent text-lg resize-none outline-none placeholder:text-slate-700"
            placeholder="Input text for analysis..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold transition-all disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Compute Vibe"}
          </button>
        </section>

        {result && (
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                  Sentiment Result
                </p>
                <h2
                  className={`text-4xl font-black ${
                    result.label === "Positive"
                      ? "text-emerald-400"
                      : result.label === "Negative"
                      ? "text-rose-500"
                      : "text-slate-400"
                  }`}
                >
                  {result.label}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                  Score
                </p>
                <p className="text-2xl font-mono">
                  {(result.score * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <DistributionBar
                label="Positive"
                value={result.distribution.positive}
                color="bg-emerald-500"
              />
              <DistributionBar
                label="Neutral"
                value={result.distribution.neutral}
                color="bg-slate-600"
              />
              <DistributionBar
                label="Negative"
                value={result.distribution.negative}
                color="bg-rose-500"
              />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function DistributionBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
        <span>{label}</span>
        <span>{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-1000`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}
