import { useState } from "react";
import { VideoTypeSelector } from "./VideoTypeSelector";
export function VideoForm({ mode }: { mode: "create" | "edit" }) {
 const [type,setType]=useState<"native"|"bridge"|null>(null);
 if (!type && mode === "create") return <VideoTypeSelector onSelect={setType}/>;
 return <div className="video-form-premium"><h2>{mode === "create" ? "Novo" : "Editar"} vídeo</h2><p>Tipo: {type ?? "carregando"}</p></div>;
}
