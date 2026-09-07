import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Square } from "lucide-react";
import type { ReactNode } from "react";

export interface ProductListItem { id: string; title: string; current_price: number | null; status: string; images?: string[] | null; categories?: { name: string } | null; marketplaces?: { name: string } | null; }

interface ProductListProps {
  products: ProductListItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  actions?: (product: ProductListItem) => ReactNode;
}

export function ProductList({ products, selectedIds, onToggle, onToggleAll, actions }: ProductListProps) {
  const allSelected = products.length > 0 && products.every((product) => selectedIds.includes(product.id));
  return (
    <div className="admin-table-wrapper">
      <Table className="admin-table">
        <TableHeader><TableRow>
          <TableHead className="w-12"><Button variant="ghost" size="icon" onClick={onToggleAll} aria-label="Selecionar todos">{allSelected ? <Checkbox checked aria-hidden="true" /> : <Square aria-hidden="true" />}</Button></TableHead>
          <TableHead>Produto</TableHead><TableHead>Categoria</TableHead><TableHead>Marketplace</TableHead><TableHead>Preço</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {products.map((product) => <TableRow key={product.id} data-state={selectedIds.includes(product.id) ? "selected" : undefined}>
            <TableCell><Button variant="ghost" size="icon" onClick={() => onToggle(product.id)} aria-label={`Selecionar ${product.title}`}><Checkbox checked={selectedIds.includes(product.id)} aria-hidden="true" /></Button></TableCell>
            <TableCell><div className="flex items-center gap-3">{product.images?.[0] ? <img src={product.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <div className="h-10 w-10 rounded-lg bg-muted" />}<span className="font-medium line-clamp-2">{product.title}</span></div></TableCell>
            <TableCell>{product.categories?.name ?? "—"}</TableCell><TableCell>{product.marketplaces?.name ?? "External"}</TableCell>
            <TableCell>{product.current_price == null ? "—" : `R$ ${product.current_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}</TableCell>
            <TableCell><Badge>{product.status}</Badge></TableCell><TableCell className="text-right">{actions?.(product)}</TableCell>
          </TableRow>)}
        </TableBody>
      </Table>
    </div>
  );
}
