import { PageHeader } from "@/components/layout/page-header";
import { ItemForm } from "@/components/inventory/item-form";

export const metadata = { title: "Add Item — StockAI" };

export default function NewItemPage() {
  return (
    <div>
      <PageHeader
        title="Add Inventory Item"
        description="Upload an image for AI name suggestions, then fill in the details."
      />
      <ItemForm mode="create" />
    </div>
  );
}
