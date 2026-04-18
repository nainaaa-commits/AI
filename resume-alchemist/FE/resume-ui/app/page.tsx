"use client";

import React, { useState } from "react";
import ReactDiffViewer from "react-diff-viewer-continued";
import { Send, FileText, Sparkles } from "lucide-react";

export default function Home() {
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [tailored, setTailored] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (!tailored) return;

    try {
      await navigator.clipboard.writeText(tailored);
      setCopied(true);

      // Reset the button text after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  const handleTailor = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: resume, job_description: jd }),
      });
      const data = await res.json();
      setTailored(data.tailored_resume);
    } catch (err) {
      console.error("Connection failed:", err);
      alert("Make sure your Python BE is running on port 8000!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 flex items-center gap-3">
          <Sparkles className="text-blue-600" /> Resume Alchemist
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Input: Original Resume */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold flex items-center gap-2">
              <FileText size={18} /> Your Current Resume
            </label>
            <textarea
              className="h-64 p-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Paste your current resume bullet points here..."
              value={resume}
              onChange={(e) => setResume(e.target.value)}
            />
          </div>

          {/* Input: Job Description */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold flex items-center gap-2">
              <Send size={18} /> Target Job Description
            </label>
            <textarea
              className="h-64 p-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Paste the job requirements here..."
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handleTailor}
          disabled={loading || !resume || !jd}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all disabled:bg-slate-400"
        >
          {loading ? "AI is Alchemizing..." : "Tailor My Resume"}
        </button>

        {/* Results Section */}
        {tailored && (
          <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Sparkles size={24} className="text-blue-500" />
                Your Tailored Content
              </h2>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                {copied ? "Copied!" : "Copy New Version"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Old */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-slate-300"></div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Original
                </h3>
                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {resume}
                </p>
              </div>

              {/* Right Column: New */}
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-500 mb-4">
                  AI Enhanced
                </h3>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                  {tailored}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
