"use client";

type Props = {
  mode: "agent" | "human";
  conversationId: string;
  onModeChange: (mode: "agent" | "human") => void;
};

export default function ModeToggle({ mode, conversationId, onModeChange }: Props) {
  async function toggle() {
    const newMode = mode === "agent" ? "human" : "agent";
    const res = await fetch(`/api/conversations/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: newMode }),
    });
    if (res.ok) {
      onModeChange(newMode);
    }
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        mode === "agent"
          ? "bg-green-900 text-green-300 hover:bg-green-800"
          : "bg-orange-900 text-orange-300 hover:bg-orange-800"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          mode === "agent" ? "bg-green-400" : "bg-orange-400"
        }`}
      />
      {mode === "agent" ? "AI Agent" : "Human Mode"}
      <span className="text-xs opacity-60">— click to switch</span>
    </button>
  );
}
