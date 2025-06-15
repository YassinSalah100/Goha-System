export type InventoryItem = {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  minQuantity: number
  lastUpdated: string
}

export const inventory: InventoryItem[] = [
  {
    id: "inv-1",
    name: "Flour",
    category: "Ingredients",
    quantity: 50,
    unit: "kg",
    minQuantity: 10,
    lastUpdated: "2023-06-10T10:00:00",
  },
  {
    id: "inv-2",
    name: "Cheese",
    category: "Ingredients",
    quantity: 20,
    unit: "kg",
    minQuantity: 5,
    lastUpdated: "2023-06-10T10:00:00",
  },
  {
    id: "inv-3",
    name: "Tomato Sauce",
    category: "Ingredients",
    quantity: 30,
    unit: "liters",
    minQuantity: 8,
    lastUpdated: "2023-06-10T10:00:00",
  },
  {
    id: "inv-4",
    name: "Chicken",
    category: "Meat",
    quantity: 25,
    unit: "kg",
    minQuantity: 10,
    lastUpdated: "2023-06-10T10:00:00",
  },
  {
    id: "inv-5",
    name: "Beef",
    category: "Meat",
    quantity: 15,
    unit: "kg",
    minQuantity: 5,
    lastUpdated: "2023-06-10T10:00:00",
  },
  {
    id: "inv-6",
    name: "Coca Cola Cans",
    category: "Drinks",
    quantity: 100,
    unit: "cans",
    minQuantity: 20,
    lastUpdated: "2023-06-10T10:00:00",
  },
  {
    id: "inv-7",
    name: "Oranges",
    category: "Fruits",
    quantity: 40,
    unit: "kg",
    minQuantity: 10,
    lastUpdated: "2023-06-10T10:00:00",
  },
]
