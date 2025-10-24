"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { toast } from "sonner";

// Define the API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function GeneratorForm() {
  const [repoUrl, setRepoUrl] = useState("");
  const [pat, setPat] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dockerfile, setDockerfile] = useState("");
  const [buildLogs, setBuildLogs] = useState("");
  
  const [pollingBuildId, setPollingBuildId] = useState<string | null>(null);

  useEffect(() => {
    if (!pollingBuildId) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/api/build/status/${pollingBuildId}`);
        const data = await response.json();

        if (data.status === 'success' || data.status === 'failed') {
          clearInterval(interval);
          setPollingBuildId(null);
          setIsLoading(false);

          // Update the UI with the final data
          setDockerfile(data.dockerfile);
          setBuildLogs(data.buildLogs);

          if (data.status === 'success') {
            toast.success("Build complete!");
          } else {
            toast.error("Build failed", { description: data.buildLogs });
          }
        } else {
          // Still pending, just update logs
          setBuildLogs(data.buildLogs || "Build is in progress...");
        }
      } catch (error) {
        // Handle polling errors
        console.error("Polling error:", error);
        toast.error("Error checking build status");
        clearInterval(interval);
        setPollingBuildId(null);
        setIsLoading(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [pollingBuildId]); // Dependency array

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setDockerfile("");
    setBuildLogs("Sending request to server..."); // Initial message

    try {
      const response = await fetch(`${API_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl, pat }),
      });

      const data = await response.json();

      if (response.status === 202) {
        // --- Build Started Successfully ---
        toast.info("Build started!", { description: "This may take a few minutes..." });
        setBuildLogs("Build is in queue... Polling for status.");
        setPollingBuildId(data.buildId);
      } else {
        // Handle initial errors from GitHub/AI
        throw new Error(data.error || "Failed to start build");
      }

    } catch (error: any) {
      toast.error("An Error Occurred", {
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Generate & Build</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ... (Your Input and Label fields) ... */}
           <div className="space-y-2">
            <Label htmlFor="repoUrl">GitHub Repository URL</Label>
            <Input
              id="repoUrl"
              placeholder="https://github.com/user/my-react-app"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pat">Personal Access Token (PAT)</Label>
            <Input
              id="pat"
              type="password"
              placeholder="ghp_..."
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Generating & Building..." : "Generate & Build Image"}
          </Button>
        </form>

        {dockerfile && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Generated Dockerfile</h3>
            <pre className="p-4 bg-secondary text-secondary-foreground rounded-md overflow-x-auto">
              <code>{dockerfile}</code>
            </pre>
          </div>
        )}
        
        {buildLogs && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Build Logs</h3>
            <pre className="p-4 bg-secondary text-secondary-foreground rounded-md overflow-x-auto">
              <code>{buildLogs}</code>
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
