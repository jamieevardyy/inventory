import { PageHeader } from "@/components/layout/page-header";
import { CategoryManager } from "@/components/categories/category-manager";

export const metadata = { title: "Categories — StockAI" };

export default function CategoriesPage() {
  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organize inventory as Category → Sub Category → Item"
      />
      <div className="p-6">
        <CategoryManager />
      </div>
    </div>
  );
}
