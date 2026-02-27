import productsReducer, {
  setSelectedProduct,
  clearSelectedProduct,
  updateProductStock,
} from '../../productsSlice';
import type { ProductsState } from '../../types';
import type { Product } from '../../../types';

const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  description: 'Test Description',
  price: 100000,
  stock: 10,
};

describe('productsSlice', () => {
  const initialState: ProductsState = {
    products: [],
    selectedProduct: null,
    loading: false,
    error: null,
  };

  it('should return the initial state', () => {
    expect(productsReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setSelectedProduct', () => {
    const actual = productsReducer(initialState, setSelectedProduct(mockProduct));
    expect(actual.selectedProduct).toEqual(mockProduct);
  });

  it('should handle clearSelectedProduct', () => {
    const stateWithProduct: ProductsState = {
      ...initialState,
      selectedProduct: mockProduct,
    };
    const actual = productsReducer(stateWithProduct, clearSelectedProduct());
    expect(actual.selectedProduct).toBeNull();
  });

  it('should handle updateProductStock', () => {
    const stateWithProducts: ProductsState = {
      ...initialState,
      products: [mockProduct],
      selectedProduct: mockProduct,
    };
    const actual = productsReducer(
      stateWithProducts,
      updateProductStock({ productId: '1', stock: 5 })
    );
    expect(actual.products[0].stock).toBe(5);
    expect(actual.selectedProduct?.stock).toBe(5);
  });
});
