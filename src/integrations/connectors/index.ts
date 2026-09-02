import { BaseConnector } from "./BaseConnector";
import { TelegramConnector } from "./TelegramConnector";
import { WhatsAppConnector } from "./WhatsAppConnector";
import { ShopeeConnector } from "./ShopeeConnector";
import { MercadoLivreConnector } from "./MercadoLivreConnector";
import { AliExpressConnector } from "./AliExpressConnector";

export function createConnector(platformId: string): BaseConnector | null {
  switch (platformId) {
    case "telegram": return new TelegramConnector();
    case "whatsapp": return new WhatsAppConnector();
    case "shopee": return new ShopeeConnector();
    case "mercadolivre": return new MercadoLivreConnector();
    case "aliexpress": return new AliExpressConnector();
    default: return null;
  }
}

export { BaseConnector, TelegramConnector, WhatsAppConnector, ShopeeConnector, MercadoLivreConnector, AliExpressConnector };
