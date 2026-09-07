import { createFileRoute } from "@tanstack/react-router";
import { OfferGroupForm } from "@/admin/offers/OfferGroupForm";

export const Route = createFileRoute("/admin/offers/new")({ component: OfferGroupForm });
