import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { VideoTypeSelector } from "./VideoTypeSelector";
import { NativeVideoForm } from "./NativeVideoForm";
import { BridgeVideoForm } from "./BridgeVideoForm";

type VideoType = "native" | "bridge";

export function VideoForm({ mode }: { mode: "create" | "edit" }) {
  const navigate = useNavigate();
  const [type, setType] = useState<VideoType | null>(null);

  if (mode === "create" && !type) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <Button variant="ghost" className="mb-6" onClick={() => navigate({ to: "/admin/videos" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <VideoTypeSelector onSelect={setType} />
      </div>
    );
  }

  const onBack = () => {
    if (mode === "create") setType(null);
    else navigate({ to: "/admin/videos" });
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <Button variant="ghost" className="mb-6" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>
      {type === "bridge" ? (
        <BridgeVideoForm onBack={onBack} />
      ) : (
        <NativeVideoForm mode={mode} onBack={onBack} />
      )}
    </div>
  );
}
