export type Order = {
  id: string
  date: string
  cashier: string
  customerName: string
  customerPhone: string
  orderType: "dine-in" | "takeaway" | "delivery"
  items: {
    id: string
    name: string
    price: number
    quantity: number
    size: string
    notes: string
    category: string
  }[]
  total: number
  status: "completed" | "pending" | "canceled"
  paymentMethod: "cash" | "card"
  cancelReason?: string
  cancelRequestedBy?: string
  cancelApprovedBy?: string
}

export const orders: Order[] = [
  {
    id: "0001",
    date: "2023-06-12T14:30:00",
    cashier: "cashier",
    customerName: "Ali Hassan",
    customerPhone: "0123456789",
    orderType: "dine-in",
    items: [
      {
        id: "pizza-1-1686579000000",
        name: "Margherita Pizza",
        price: 8.99,
        quantity: 2,
        size: "medium",
        notes: "Extra cheese",
        category: "pizza",
      },
      {
        id: "drinks-1-1686579000001",
        name: "Coca Cola",
        price: 1.99,
        quantity: 2,
        size: "medium",
        notes: "With ice",
        category: "drinks",
      },
    ],
    total: 21.96,
    status: "completed",
    paymentMethod: "cash",
  },
  {
    id: "0002",
    date: "2023-06-12T16:45:00",
    cashier: "cashier",
    customerName: "Sara Ahmed",
    customerPhone: "0123456788",
    orderType: "takeaway",
    items: [
      {
        id: "feteer-1-1686587100000",
        name: "Sweet Feteer",
        price: 12.99,
        quantity: 1,
        size: "large",
        notes: "Extra honey",
        category: "feteer",
      },
    ],
    total: 12.99,
    status: "completed",
    paymentMethod: "card",
  },
  {
    id: "0003",
    date: new Date().toISOString(),
    cashier: "cashier",
    customerName: "Mohamed Khalid",
    customerPhone: "0123456787",
    orderType: "delivery",
    items: [
      {
        id: "grilled-1-1686587100000",
        name: "Grilled Chicken",
        price: 15.99,
        quantity: 1,
        size: "full",
        notes: "Spicy",
        category: "grilled",
      },
      {
        id: "sandwiches-1-1686587100001",
        name: "Chicken Sandwich",
        price: 6.99,
        quantity: 2,
        size: "regular",
        notes: "",
        category: "sandwiches",
      },
    ],
    total: 29.97,
    status: "pending",
    paymentMethod: "cash",
  },
]
