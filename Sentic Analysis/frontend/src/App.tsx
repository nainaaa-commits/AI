import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SentimentData {
  id: number;
  text: string;
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
  const [history, setHistory] = useState<SentimentData[]>([]);
  const [loading, setLoading] = useState(false);

  // Download JSON Function
  const exportToJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analysis-${result.id}.json`;
    link.click();
  };

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
      const newResult = { ...data, text: input, id: Date.now() };

      setResult(newResult);
      setHistory((prev) => [newResult, ...prev].slice(0, 10)); // Keep last 10
      setInput(""); // Clear input after success
    } catch (err) {
      alert("Backend service unreachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 overflow-x-hidden">
      <header className="max-w-7xl mx-auto mb-8">
        <h1 className="text-2xl font-black tracking-tighter text-blue-500">
          SENTIC<span className="text-slate-100"> ANALYZER</span>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">
            Neural Sentiment Analysis
          </p>
        </h1>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <textarea
              className="w-full h-32 bg-transparent text-lg resize-none outline-none placeholder:text-slate-700"
              placeholder="Type something to analyze its vibe..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              onClick={handleAnalyze}
              disabled={loading || !input.trim()}
              className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? "Neural Processing..." : "Analyze Sentiment"}
            </button>
          </section>

          <AnimatePresence mode="wait">
            {result && (
              <motion.section
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-8"
              >
                <div className="flex justify-between items-start mb-6">
                  <h2
                    className={`text-5xl font-black ${
                      result.label === "Positive"
                        ? "text-emerald-400"
                        : result.label === "Negative"
                        ? "text-rose-500"
                        : "text-slate-400"
                    }`}
                  >
                    {result.label}
                  </h2>
                  <button
                    onClick={exportToJson}
                    className="text-xs bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-full font-bold transition-colors"
                  >
                    Download JSON
                  </button>
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
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 h-fit min-h-[400px]">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">
            Recent History
          </h3>
          <div className="space-y-3">
            <AnimatePresence>
              {history.length === 0 && (
                <p className="text-slate-700 italic text-sm text-center mt-10">
                  No history yet
                </p>
              )}
              {history.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 flex items-center gap-3 group hover:border-slate-600 transition-colors"
                >
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      item.label === "Positive"
                        ? "bg-emerald-500"
                        : item.label === "Negative"
                        ? "bg-rose-500"
                        : "bg-slate-500"
                    }`}
                  />
                  <p className="text-sm text-slate-300 truncate flex-1 font-medium">
                    {item.text}
                  </p>
                  <span className="text-[10px] font-mono text-slate-500">
                    {(item.score * 100).toFixed(0)}%
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
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
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 1 }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}
