export type Worker = {
  id: string
  name: string
  position: string
  hourlyRate: number
  phone: string
  joinDate: string
  attendance: {
    date: string
    checkIn: string
    checkOut: string
    hoursWorked: number
    wage: number
  }[]
}

export const workers: Worker[] = [
  {
    id: "worker-1",
    name: "Ahmed Mohamed",
    position: "Cashier",
    hourlyRate: 10,
    phone: "0123456789",
    joinDate: "2023-01-15",
    attendance: [
      {
        date: "2023-06-10",
        checkIn: "09:00",
        checkOut: "17:00",
        hoursWorked: 8,
        wage: 80,
      },
      {
        date: "2023-06-11",
        checkIn: "09:00",
        checkOut: "17:00",
        hoursWorked: 8,
        wage: 80,
      },
    ],
  },
  {
    id: "worker-2",
    name: "Mahmoud Ali",
    position: "Chef",
    hourlyRate: 15,
    phone: "0123456788",
    joinDate: "2022-11-10",
    attendance: [
      {
        date: "2023-06-10",
        checkIn: "08:00",
        checkOut: "16:00",
        hoursWorked: 8,
        wage: 120,
      },
      {
        date: "2023-06-11",
        checkIn: "08:00",
        checkOut: "16:00",
        hoursWorked: 8,
        wage: 120,
      },
    ],
  },
  {
    id: "worker-3",
    name: "Sara Ahmed",
    position: "Waiter",
    hourlyRate: 8,
    phone: "0123456787",
    joinDate: "2023-03-20",
    attendance: [
      {
        date: "2023-06-10",
        checkIn: "16:00",
        checkOut: "00:00",
        hoursWorked: 8,
        wage: 64,
      },
      {
        date: "2023-06-11",
        checkIn: "16:00",
        checkOut: "00:00",
        hoursWorked: 8,
        wage: 64,
      },
    ],
  },
]
