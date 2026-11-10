import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Template = "demonstration" | "story" | "expert";

type PartnerCreativeKitProps = {
  productTitle: string;
  category: string | null;
  referralCode: string;
};

const templates: { id: Template; label: string; guidance: string }[] = [
  { id: "demonstration", label: "Demonstração", guidance: "Mostre apenas características que você verificou. Grave material próprio ou autorizado." },
  { id: "story", label: "Story / Comunidade", guidance: "Explique para quem o produto pode ser interessante, sem alegar desconto ou escassez não comprovados." },
  { id: "expert", label: "Expert / Nicho", guidance: "Conecte a apresentação ao seu nicho sem prometer resultados técnicos, médicos ou financeiros." },
];

/**
 * Materiais iniciais de texto, sem reivindicar provas de desempenho, descontos,
 * autorização de imagem ou disponibilidade de checkout.
 * Este kit não cria comissão nem libera produtos adicionais.
 */
export function PartnerCreativeKit({ productTitle, category, referralCode }: PartnerCreativeKitProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Template>("demonstration");
  const product = productTitle.trim();
  const niche = category?.trim() || "produtos selecionados";

  const getCopy = (link: string): string => {
    switch (selected) {
      case "story":
        return `Publicidade · link de parceiro RUBI\n\nVocê gosta de ${niche}? Conheça "${product}" e confira se faz sentido para você. Veja os detalhes e o preço atualizado na página oficial da indicação.\n\n${link}`;
      case "expert":
        return `Publicidade · parceria RUBI\n\nPara quem acompanha conteúdos sobre ${niche}: vale conhecer "${product}". Confira características, condições disponíveis e preço atualizado antes de decidir.\n\n${link}`;
      default:
        return `Publicidade · link de parceiro RUBI\n\nHoje vou apresentar "${product}", uma seleção da RUBI. Veja os detalhes do produto e o preço atualizado neste link de indicação.\n\n${link}`;
    }
  };

  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("A cópia automática não está disponível neste navegador.");
      }
      const url = new URL(`/r/${referralCode}`, window.location.origin).toString();
      await navigator.clipboard.writeText(getCopy(url));
      toast.success("Texto e link individual copiados.");
    } catch {
      toast.error("Não foi possível copiar. Tente em um navegador seguro (HTTPS).");
    }
  };

  return (
    <section aria-label={`Kit de divulgação de ${product}`} className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
      <Button type="button" variant="outline" size="sm" aria-expanded={isOpen} onClick={() => setIsOpen(value => !value)}>
        {isOpen ? "Fechar kit de divulgação" : "Criar texto para divulgar"}
      </Button>
      {isOpen && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Modelos de texto para este produto autorizado. Inclua a identificação publicitária no conteúdo.
            Use somente imagens, alegações e materiais com autorização; consulte o preço vigente.
          </p>
          <label className="block space-y-1 text-sm font-medium">
            Formato do conteúdo
            <select
              value={selected}
              onChange={event => setSelected(event.target.value as Template)}
              className="block w-full rounded-lg border bg-background p-2 text-sm"
            >
              {templates.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <p className="text-xs text-muted-foreground">{templates.find(item => item.id === selected)?.guidance}</p>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-background p-3 text-xs">
            {getCopy(`/r/${referralCode}`)}
          </pre>
          <Button type="button" size="sm" onClick={() => void copy()}>Copiar texto com meu link</Button>
          <p className="text-xs text-muted-foreground">
            O link encaminha à apresentação da indicação. O checkout do fornecedor ainda requer integração e confirmação oficial.
            Divulgação não é pedido pago nem comissão garantida.
          </p>
        </div>
      )}
    </section>
  );
}
