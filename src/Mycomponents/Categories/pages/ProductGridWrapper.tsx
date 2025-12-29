import { useParams } from 'react-router-dom';
import ProductGrid from '../../Products/pages/ProductGrid';

export default function ProductGridWrapper() {
  const { category } = useParams<{ category: string }>();

  if (!category) {
    return <ProductGrid />;
  }

  // pass the raw category name (from URL) to ProductGrid, which will
  // use useProductsByCategoryName internally
  return (
    <ProductGrid
      category={category}
      title={category?.toUpperCase()}
    />
  );
}