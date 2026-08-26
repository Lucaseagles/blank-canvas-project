import { Link } from "@tanstack/react-router";
import { ShoppingBag, Github, Twitter, Instagram, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t py-12 px-4 mt-20 reveal-on-scroll">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <ShoppingBag size={18} />
            </div>
            <span className="text-lg font-bold tracking-tight">
              AFFILIATE<span className="text-primary">PRO</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A próxima geração do comércio orientado por descoberta. Agregamos as melhores ofertas dos principais marketplaces usando inteligência artificial.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center justify-center min-w-[44px] min-h-[44px] -m-2">
              <Twitter size={20} />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center justify-center min-w-[44px] min-h-[44px] -m-2">
              <Instagram size={20} />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center justify-center min-w-[44px] min-h-[44px] -m-2">
              <Github size={20} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-4">Plataforma</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/feed" className="hover:text-primary transition-colors inline-flex items-center min-h-[44px] py-2">Feed de Descoberta</Link></li>
            <li><Link to="/videos" className="hover:text-primary transition-colors inline-flex items-center min-h-[44px] py-2">Comércio em Vídeo</Link></li>
            <li><Link to="/favorites" className="hover:text-primary transition-colors inline-flex items-center min-h-[44px] py-2">Sinais Salvos</Link></li>
            <li><Link to="/alerts" className="hover:text-primary transition-colors inline-flex items-center min-h-[44px] py-2">Centro de Alertas</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4">Suporte</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-primary transition-colors inline-flex items-center min-h-[44px] py-2">Central de Ajuda</a></li>
            <li><a href="#" className="hover:text-primary transition-colors inline-flex items-center min-h-[44px] py-2">Segurança</a></li>
            <li><a href="#" className="hover:text-primary transition-colors inline-flex items-center min-h-[44px] py-2">Guia do Marketplace</a></li>
            <li><a href="#" className="hover:text-primary transition-colors inline-flex items-center min-h-[44px] py-2">Termos de Afiliado</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4">Newsletter</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Receba as melhores ofertas diretamente na sua caixa de entrada.
          </p>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input 
              type="email" 
              placeholder="Seu e-mail"
              className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
        <p>© 2026 Plataforma AffiliatePro. Todos os direitos reservados.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-primary transition-colors inline-flex items-center min-h-[44px] py-2">Política de Privacidade</a>
          <a href="#" className="hover:text-primary transition-colors inline-flex items-center min-h-[44px] py-2">Termos de Serviço</a>
          <a href="#" className="hover:text-primary transition-colors inline-flex items-center min-h-[44px] py-2">Configurações de Cookies</a>
        </div>
      </div>
    </footer>
  );
}
