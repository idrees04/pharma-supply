import { useMemo, useState } from 'react';

import { useProduct, useProductList } from '@/api/services/products';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Product } from '@/types/api/products';

export function ProductManagementExample() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const queryParams = useMemo(
    () => ({
      pageNumber: 1,
      pageSize: 20,
      searchTerm: searchTerm.trim() || undefined,
      sortBy: 'productName',
      sortDescending: false,
    }),
    [searchTerm],
  );

  const { data, isPending, error } = useProductList(queryParams);
  const { data: selectedProduct } = useProduct(selectedId);

  const products = data?.items ?? [];

  if (error) {
    return <Card className="p-6 text-destructive">{error.userMessage}</Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Input
          className="max-w-md"
          placeholder="Search products"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <Badge variant="outline">{data?.totalCount ?? 0} total</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <p className="text-sm text-muted-foreground">Loading products…</p>
            ) : (
              <div className="space-y-2">
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left hover:bg-muted/50"
                    onClick={() => setSelectedId(product.id)}
                  >
                    <div>
                      <p className="font-medium">{product.productName}</p>
                      <p className="text-xs text-muted-foreground">{product.productCode}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{product.availableQuantity} {product.unitName}</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Selected product</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedProduct ? (
              <ProductDetails product={selectedProduct} />
            ) : (
              <p className="text-sm text-muted-foreground">Select a product to inspect its details.</p>
            )}
            <Button className="mt-4" variant="outline" onClick={() => setSelectedId(null)}>
              Clear selection
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProductDetails({ product }: { product: Product }) {
  return (
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Generic name</dt><dd className="font-medium">{product.genericName}</dd></div>
      <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Manufacturer</dt><dd className="font-medium">{product.manufacturer}</dd></div>
      <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Purchase rate</dt><dd className="font-medium">{product.standardPurchaseRate}</dd></div>
      <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Sale rate</dt><dd className="font-medium">{product.standardSaleRate}</dd></div>
      <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Tax</dt><dd className="font-medium">{product.taxPercentage}%</dd></div>
      <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Active</dt><dd className="font-medium">{product.isActive ? 'Yes' : 'No'}</dd></div>
    </dl>
  );
}
