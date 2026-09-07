import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "@/admin/products/ProductForm";

export const Route = createFileRoute("/admin/products/new")({
  component: () => <ProductForm mode="create" />,
});
