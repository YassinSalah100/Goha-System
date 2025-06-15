export type User = {
  id: string
  username: string
  password: string
  name: string
  role: "cashier" | "admin" | "owner"
}

export const users: User[] = [
  {
    id: "1",
    username: "cashier",
    password: "password",
    name: "أحمد محمد",
    role: "cashier",
  },
  {
    id: "2",
    username: "admin",
    password: "password",
    name: "سارة أحمد",
    role: "admin",
  },
  {
    id: "3",
    username: "owner",
    password: "password",
    name: "محمد علي",
    role: "owner",
  },
]
