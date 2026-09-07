import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "@/admin/products/ProductForm";

export const Route = createFileRoute("/admin/products/$id/edit")({
  component: function EditProductPage() {
    const { id } = Route.useParams();
    return <ProductForm mode="edit" productId={id} />;
  },
});
