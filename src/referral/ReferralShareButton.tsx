import { useState } from "react";
import { Share2 } from "lucide-react";
import { ShareModal } from "@/sharing/ShareModal";

export function ReferralShareButton({ referralCode, referralLink, userName, reward = "recompensas exclusivas", userId }: { referralCode: string; referralLink: string; userName: string; reward?: string; userId?: string | null }) {
  const [open, setOpen] = useState(false);
  return <><button type="button" onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[10px] font-black uppercase tracking-wider text-primary-foreground"><Share2 className="h-4 w-4" />Compartilhar convite</button><ShareModal isOpen={open} onClose={() => setOpen(false)} referralCode={referralCode} referralLink={referralLink} userName={userName} reward={reward} userId={userId} /></>;
}
