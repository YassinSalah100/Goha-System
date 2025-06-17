export type MenuItem = {
  id: string
  name: string
  category: string
  description: string
  prices: Record<string, number>
  image?: string
  available: boolean
}

export const menuItems: MenuItem[] = [
  // Pizza
  {
    id: "pizza-1",
    name: "بيتزا مارجريتا",
    category: "pizza",
    description: "بيتزا كلاسيكية بصلصة الطماطم والموتزاريلا والريحان",
    prices: {
      small: 45,
      medium: 65,
      large: 85,
    },
    image: "/images/menu/margherita-pizza.jpg",
    available: true,
  },
  {
    id: "pizza-2",
    name: "بيتزا بيبروني",
    category: "pizza",
    description: "بيتزا بصلصة الطماطم والموتزاريلا والبيبروني",
    prices: {
      small: 55,
      medium: 75,
      large: 95,
    },
    image: "/images/menu/pepperoni-pizza.jpg",
    available: true,
  },
  {
    id: "pizza-3",
    name: "بيتزا الخضار",
    category: "pizza",
    description: "بيتزا بالخضار المشكلة والفلفل الملون والزيتون",
    prices: {
      small: 50,
      medium: 70,
      large: 90,
    },
    image: "/images/menu/vegetable-pizza.jpg",
    available: true,
  },
  {
    id: "pizza-4",
    name: "بيتزا الفراخ",
    category: "pizza",
    description: "بيتزا بقطع الفراخ المشوية والفلفل الأخضر",
    prices: {
      small: 60,
      medium: 80,
      large: 100,
    },
    image: "/images/menu/chicken-pizza.jpg",
    available: true,
  },
  {
    id: "pizza-5",
    name: "بيتزا سوبر سوبريم",
    category: "pizza",
    description: "بيتزا باللحم والفراخ والخضار والجبن الإضافي",
    prices: {
      small: 75,
      medium: 95,
      large: 120,
    },
    image: "/images/menu/supreme-pizza.jpg",
    available: true,
  },

  // Feteer
  {
    id: "feteer-1",
    name: "فطير حلو بالعسل",
    category: "feteer",
    description: "فطير مشلتت حلو بالعسل الأبيض والمكسرات",
    prices: {
      medium: 35,
      large: 50,
    },
    image: "/images/menu/sweet-feteer.jpg",
    available: true,
  },
  {
    id: "feteer-2",
    name: "فطير بالجبنة الرومي",
    category: "feteer",
    description: "فطير مالح بالجبنة الرومي والطحينة",
    prices: {
      medium: 40,
      large: 55,
    },
    image: "/images/menu/cheese-feteer.jpg",
    available: true,
  },
  {
    id: "feteer-3",
    name: "فطير باللحمة المفرومة",
    category: "feteer",
    description: "فطير باللحمة المفرومة والبصل والطماطم",
    prices: {
      medium: 50,
      large: 70,
    },
    image: "/images/menu/meat-feteer.jpg",
    available: true,
  },
  {
    id: "feteer-4",
    name: "فطير بالفراخ",
    category: "feteer",
    description: "فطير بقطع الفراخ المتبلة والخضار",
    prices: {
      medium: 45,
      large: 65,
    },
    image: "/images/menu/chicken-feteer.jpg",
    available: true,
  },

  // Sandwiches
  {
    id: "sandwiches-1",
    name: "ساندويتش فراخ مشوية",
    category: "sandwiches",
    description: "فراخ مشوية بالخس والطماطم والصوص الخاص",
    prices: {
      regular: 25,
    },
    image: "/images/menu/grilled-chicken-sandwich.jpg",
    available: true,
  },
  {
    id: "sandwiches-2",
    name: "ساندويتش شاورما لحمة",
    category: "sandwiches",
    description: "شاورما اللحمة بالطحينة والسلطة",
    prices: {
      regular: 30,
    },
    image: "/images/menu/beef-shawarma.jpg",
    available: true,
  },
  {
    id: "sandwiches-3",
    name: "ساندويتش كفتة",
    category: "sandwiches",
    description: "كفتة مشوية بالسلطة والطحينة",
    prices: {
      regular: 28,
    },
    image: "/images/menu/kofta-sandwich.jpg",
    available: true,
  },
  {
    id: "sandwiches-4",
    name: "ساندويتش فلافل",
    category: "sandwiches",
    description: "فلافل طازج بالسلطة والطحينة",
    prices: {
      regular: 15,
    },
    image: "/images/menu/falafel-sandwich.jpg",
    available: true,
  },
  {
    id: "sandwiches-5",
    name: "ساندويتش برجر لحمة",
    category: "sandwiches",
    description: "برجر لحمة بالجبنة والخس والطماطم",
    prices: {
      regular: 35,
    },
    image: "/images/menu/beef-burger.jpg",
    available: true,
  },

  // Crepes
  {
    id: "crepes-1",
    name: "كريب نوتيلا",
    category: "crepes",
    description: "كريب حلو بالنوتيلا والموز",
    prices: {
      regular: 20,
    },
    image: "/images/menu/nutella-crepe.jpg",
    available: true,
  },
  {
    id: "crepes-2",
    name: "كريب فراخ",
    category: "crepes",
    description: "كريب مالح بالفراخ والجبنة والخضار",
    prices: {
      regular: 25,
    },
    image: "/images/menu/chicken-crepe.jpg",
    available: true,
  },
  {
    id: "crepes-3",
    name: "كريب تونة",
    category: "crepes",
    description: "كريب بالتونة والجبنة والخضار",
    prices: {
      regular: 22,
    },
    image: "/images/menu/tuna-crepe.jpg",
    available: true,
  },
  {
    id: "crepes-4",
    name: "كريب جبنة وعسل",
    category: "crepes",
    description: "كريب حلو بالجبنة البيضاء والعسل",
    prices: {
      regular: 18,
    },
    image: "/images/menu/cheese-honey-crepe.jpg",
    available: true,
  },

  // Grilled Chicken
  {
    id: "grilled-1",
    name: "فراخ مشوية كاملة",
    category: "grilled",
    description: "فراخ مشوية كاملة بالتوابل الخاصة",
    prices: {
      half: 45,
      full: 80,
    },
    image: "/images/menu/whole-grilled-chicken.jpg",
    available: true,
  },
  {
    id: "grilled-2",
    name: "فراخ بانيه",
    category: "grilled",
    description: "قطع فراخ بانيه مقرمشة مع البطاطس",
    prices: {
      regular: 40,
    },
    image: "/images/menu/chicken-fillet.jpg",
    available: true,
  },
  {
    id: "grilled-3",
    name: "فراخ كنتاكي",
    category: "grilled",
    description: "قطع فراخ مقرمشة على الطريقة الأمريكية",
    prices: {
      regular: 45,
    },
    image: "/images/menu/kfc-chicken.jpg",
    available: true,
  },

  // Drinks
  {
    id: "drinks-1",
    name: "كوكاكولا",
    category: "drinks",
    description: "مشروب غازي منعش",
    prices: {
      small: 8,
      medium: 12,
      large: 15,
    },
    image: "/images/menu/coca-cola.jpg",
    available: true,
  },
  {
    id: "drinks-2",
    name: "عصير برتقال طازج",
    category: "drinks",
    description: "عصير برتقال طبيعي طازج",
    prices: {
      small: 15,
      medium: 20,
      large: 25,
    },
    image: "/images/menu/orange-juice.jpg",
    available: true,
  },
  {
    id: "drinks-3",
    name: "عصير مانجو",
    category: "drinks",
    description: "عصير مانجو طبيعي",
    prices: {
      small: 18,
      medium: 23,
      large: 28,
    },
    image: "/images/menu/mango-juice.jpg",
    available: true,
  },
  {
    id: "drinks-4",
    name: "شاي أحمر",
    category: "drinks",
    description: "شاي أحمر ساخن",
    prices: {
      regular: 5,
    },
    image: "/images/menu/black-tea.jpg",
    available: true,
  },
  {
    id: "drinks-5",
    name: "قهوة تركي",
    category: "drinks",
    description: "قهوة تركي أصلية",
    prices: {
      regular: 8,
    },
    image: "/images/menu/turkish-coffee.jpg",
    available: true,
  },
  {
    id: "drinks-6",
    name: "نسكافيه",
    category: "drinks",
    description: "نسكافيه بالحليب",
    prices: {
      regular: 12,
    },
    image: "/images/menu/nescafe.jpg",
    available: true,
  },

  // Pasta
  {
    id: "pasta-1",
    name: "مكرونة بالصلصة الحمراء",
    category: "pasta",
    description: "مكرونة بصلصة الطماطم والريحان",
    prices: {
      regular: 30,
    },
    image: "/images/menu/red-sauce-pasta.jpg",
    available: true,
  },
  {
    id: "pasta-2",
    name: "مكرونة بالفراخ",
    category: "pasta",
    description: "مكرونة بقطع الفراخ والكريمة",
    prices: {
      regular: 40,
    },
    image: "/images/menu/chicken-pasta.jpg",
    available: true,
  },
  {
    id: "pasta-3",
    name: "مكرونة بالجمبري",
    category: "pasta",
    description: "مكرونة بالجمبري والصلصة البيضاء",
    prices: {
      regular: 55,
    },
    image: "/images/menu/shrimp-pasta.jpg",
    available: true,
  },

  // Rice
  {
    id: "rice-1",
    name: "أرز بالفراخ",
    category: "rice",
    description: "أرز أبيض بقطع الفراخ المشوية",
    prices: {
      regular: 35,
    },
    image: "/images/menu/chicken-rice.jpg",
    available: true,
  },
  {
    id: "rice-2",
    name: "أرز بالخضار",
    category: "rice",
    description: "أرز بالخضار المشكلة",
    prices: {
      regular: 25,
    },
    image: "/images/menu/vegetable-rice.jpg",
    available: true,
  },
  {
    id: "rice-3",
    name: "كشري",
    category: "rice",
    description: "كشري مصري بالعدس والمكرونة والصلصة",
    prices: {
      regular: 20,
    },
    image: "/images/menu/koshari.jpg",
    available: true,
  },

  // Desserts
  {
    id: "desserts-1",
    name: "أم علي",
    category: "desserts",
    description: "حلوى أم علي بالمكسرات والزبيب",
    prices: {
      regular: 25,
    },
    image: "/images/menu/om-ali.jpg",
    available: true,
  },
  {
    id: "desserts-2",
    name: "مهلبية",
    category: "desserts",
    description: "مهلبية بالفانيليا والمكسرات",
    prices: {
      regular: 15,
    },
    image: "/images/menu/muhalabia.jpg",
    available: true,
  },
  {
    id: "desserts-3",
    name: "كنافة",
    category: "desserts",
    description: "كنافة بالجبنة والقطر",
    prices: {
      regular: 30,
    },
    image: "/images/menu/kunafa.jpg",
    available: true,
  },
]
