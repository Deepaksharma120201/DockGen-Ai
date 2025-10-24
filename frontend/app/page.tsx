import { GeneratorForm } from "@/app/components/GeneratorForm";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="z-10 w-full max-w-2xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-2">DockGen AI</h1>
        <p className="text-center text-muted-foreground mb-8">
          Generate a Dockerfile & Build an Image from JS Repo
        </p>

        <GeneratorForm />
      </div>
    </main>
  );
}
