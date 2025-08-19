export interface OrderItem {
  name: string
  quantity: number
  price: number
  category: string
}

export interface Order {
  id: string
  date: string
  cashier: string
  total: number
  orderType: "dine-in" | "takeaway" | "delivery"
  paymentMethod: "cash" | "card"
  items: OrderItem[]
}

export const orders: Order[] = [
  {
    id: "ORD001",
    date: "2025-08-19T10:30:00Z",
    cashier: "cashier",
    total: 25.50,
    orderType: "dine-in",
    paymentMethod: "cash",
    items: [
      { name: "قهوة عربية", quantity: 2, price: 8.00, category: "مشروبات" },
      { name: "كرواسان", quantity: 1, price: 9.50, category: "معجنات" }
    ]
  },
  {
    id: "ORD002",
    date: "2025-08-19T11:15:00Z",
    cashier: "sara",
    total: 18.75,
    orderType: "takeaway",
    paymentMethod: "card",
    items: [
      { name: "شاي أحمر", quantity: 1, price: 6.25, category: "مشروبات" },
      { name: "كيك شوكولاتة", quantity: 1, price: 12.50, category: "حلويات" }
    ]
  },
  {
    id: "ORD003",
    date: "2025-08-18T14:20:00Z",
    cashier: "cashier",
    total: 42.00,
    orderType: "dine-in",
    paymentMethod: "cash",
    items: [
      { name: "لاتيه", quantity: 3, price: 12.00, category: "مشروبات" },
      { name: "ساندويش", quantity: 1, price: 18.00, category: "طعام" }
    ]
  },
  {
    id: "ORD004",
    date: "2025-08-18T16:45:00Z",
    cashier: "sara",
    total: 15.25,
    orderType: "delivery",
    paymentMethod: "card",
    items: [
      { name: "عصير برتقال", quantity: 2, price: 7.50, category: "مشروبات" },
      { name: "دونات", quantity: 1, price: 8.25, category: "حلويات" }
    ]
  },
  {
    id: "ORD005",
    date: "2025-08-17T09:30:00Z",
    cashier: "cashier",
    total: 31.75,
    orderType: "takeaway",
    paymentMethod: "cash",
    items: [
      { name: "كابتشينو", quantity: 2, price: 10.00, category: "مشروبات" },
      { name: "مافن", quantity: 3, price: 11.75, category: "معجنات" }
    ]
  }
]
