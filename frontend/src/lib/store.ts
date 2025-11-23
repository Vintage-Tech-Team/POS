import { create } from 'zustand';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  company: {
    id: number;
    name: string;
  };
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  hasRole: (roles: string[]) => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user, token });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    set({ user: null, token: null });
  },
  isAuthenticated: () => {
    const { token } = get();
    return !!token;
  },
  isAdmin: () => {
    const { user } = get();
    return user?.role === 'admin' || false;
  },
  isManager: () => {
    const { user } = get();
    return user?.role === 'manager' || false;
  },
  hasRole: (roles: string[]) => {
    const { user } = get();
    return user ? roles.includes(user.role) : false;
  },
}));

// Initialize auth from localStorage on client side
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      useAuthStore.setState({ user, token });
    } catch (error) {
      console.error('Failed to parse user data:', error);
    }
  }
}

interface CartItem {
  product_id: number;
  barcode: string;
  name: string;
  qty: number;
  unit_price: number;
  tax: number;
  discount: number;
  total: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'total'>) => void;
  updateQuantity: (productId: number, qty: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getTotalTax: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item) => {
    const { items } = get();
    const existingItem = items.find((i) => i.product_id === item.product_id);

    if (existingItem) {
      set({
        items: items.map((i) =>
          i.product_id === item.product_id
            ? {
                ...i,
                qty: i.qty + item.qty,
                total:
                  (i.qty + item.qty) * item.unit_price +
                  item.tax -
                  item.discount,
              }
            : i
        ),
      });
    } else {
      const total = item.qty * item.unit_price + item.tax - item.discount;
      set({ items: [...items, { ...item, total }] });
    }
  },
  updateQuantity: (productId, qty) => {
    const { items } = get();
    if (qty <= 0) {
      set({ items: items.filter((i) => i.product_id !== productId) });
    } else {
      set({
        items: items.map((i) =>
          i.product_id === productId
            ? {
                ...i,
                qty,
                total: qty * i.unit_price + i.tax - i.discount,
              }
            : i
        ),
      });
    }
  },
  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.product_id !== productId) });
  },
  clearCart: () => {
    set({ items: [] });
  },
  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.total, 0);
  },
  getTotalTax: () => {
    return get().items.reduce((sum, item) => sum + item.tax, 0);
  },
}));


