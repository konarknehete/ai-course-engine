"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface Course {
  title: string;
  description: string;
  modules: any[];
}

export default function Home() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [courseData, setCourseData] = useState<Course | null>(null);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  const pollJobStatus = async (jobId: string) => {
    while (true) {
      const res = await fetch(`http://localhost:8080/api/courses/status/${jobId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch job status");
      }
      const data = await res.json();

      if (data.state === "completed") {
        setCourseData(data.result);
        setStatus("Completed");
        setLoading(false);
        break;
      } else if (data.state === "failed") {
        throw new Error("Job failed");
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    setError("");
    setCourseData(null);
    setStatus("Initiating...");

    try {
      const res = await fetch("http://localhost:8080/api/courses/generate-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      if (!res.ok) throw new Error("Failed to start job");
      const data = await res.json();

      setStatus("Processing Generation in Background...");
      await pollJobStatus(data.jobId);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
      <Card className="w-full max-w-3xl mb-8">
        <CardHeader>
          <CardTitle>AI Course Generator</CardTitle>
          <CardDescription>Generate multi-lesson courses powered by Google Genkit</CardDescription>
        </CardHeader>
        <CardContent className="flex space-x-4">
          <Input
            placeholder="e.g., Introduction to Python for Data Science"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={loading}
          />
          <Button onClick={handleGenerate} disabled={loading || !topic}>
            {loading ? "Generating..." : "Generate"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="w-full max-w-3xl mb-8">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <Alert className="w-full max-w-3xl mb-8 bg-blue-50">
          <AlertTitle>Status</AlertTitle>
          <AlertDescription>{status}</AlertDescription>
        </Alert>
      )}

      {courseData && (
        <div className="w-full max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-4xl font-bold tracking-tight">{courseData.title}</h1>
          <p className="text-xl text-gray-500">{courseData.description}</p>

          {courseData.modules.map((mod, i) => (
            <Card key={i} className="mb-6">
              <CardHeader>
                <CardTitle className="text-2xl">{mod.moduleName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mod.lessons.map((lesson: any, j: number) => (
                  <div key={j} className="border p-4 rounded-lg bg-white shadow-sm">
                    <h3 className="text-lg font-semibold">{lesson.title}</h3>
                    <div className="mt-2 prose max-w-none text-sm text-gray-700">
                      {lesson.content.substring(0, 300)}...  {/* Truncated for Demo */}
                    </div>
                    <Button variant="outline" className="mt-4" size="sm">View Full Lesson</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
