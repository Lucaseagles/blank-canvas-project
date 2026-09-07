import { createFileRoute } from "@tanstack/react-router";
import { ProductImport } from "@/admin/products/ProductImport";
export const Route=createFileRoute("/admin/products/import")({component:ProductImport});
