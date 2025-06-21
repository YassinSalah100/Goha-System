export type MenuItem = {
  id: string
  name: string
  category: string
  description: string
  prices: Record<string, number>
  image?: string
  available: boolean
  extras?: {
    name: string
    price: number
    description?: string
  }[]
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
    extras: [
      { name: "إضافة جبنة", price: 10, description: "جبنة إضافية" },
      { name: "اطراف جبنة", price: 15, description: "اطراف البيتزا بالجبنة" },
      { name: "جبنة موتزاريلا إضافية", price: 12, description: "طبقة إضافية من الموتزاريلا" },
      { name: "جبنة رومي", price: 8, description: "إضافة جبنة رومي" },
      { name: "جبنة شيدر", price: 8, description: "إضافة جبنة شيدر" },
    ]
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
    extras: [
      { name: "إضافة جبنة", price: 10, description: "جبنة إضافية" },
      { name: "اطراف جبنة", price: 15, description: "اطراف البيتزا بالجبنة" },
      { name: "بيبروني إضافي", price: 12, description: "كمية إضافية من البيبروني" },
      { name: "جبنة موتزاريلا إضافية", price: 12, description: "طبقة إضافية من الموتزاريلا" },
      { name: "جبنة رومي", price: 8, description: "إضافة جبنة رومي" },
    ]
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
    extras: [
      { name: "إضافة جبنة", price: 10, description: "جبنة إضافية" },
      { name: "اطراف جبنة", price: 15, description: "اطراف البيتزا بالجبنة" },
      { name: "خضار إضافية", price: 8, description: "خضار مشكلة إضافية" },
      { name: "فطر طازج", price: 6, description: "إضافة فطر طازج" },
      { name: "زيتون إضافي", price: 5, description: "كمية إضافية من الزيتون" },
    ]
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
    extras: [
      { name: "إضافة جبنة", price: 10, description: "جبنة إضافية" },
      { name: "اطراف جبنة", price: 15, description: "اطراف البيتزا بالجبنة" },
      { name: "فراخ إضافية", price: 15, description: "كمية إضافية من الفراخ" },
      { name: "جبنة موتزاريلا إضافية", price: 12, description: "طبقة إضافية من الموتزاريلا" },
      { name: "فلفل ملون", price: 5, description: "إضافة فلفل ملون" },
    ]
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
    extras: [
      { name: "إضافة جبنة", price: 10, description: "جبنة إضافية" },
      { name: "اطراف جبنة", price: 15, description: "اطراف البيتزا بالجبنة" },
      { name: "لحم إضافي", price: 18, description: "كمية إضافية من اللحم" },
      { name: "فراخ إضافية", price: 15, description: "كمية إضافية من الفراخ" },
      { name: "جبنة موتزاريلا إضافية", price: 12, description: "طبقة إضافية من الموتزاريلا" },
    ]
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
    extras: [
      { name: "عسل إضافي", price: 5, description: "كمية إضافية من العسل" },
      { name: "مكسرات إضافية", price: 8, description: "مكسرات مشكلة إضافية" },
      { name: "جوز هند", price: 3, description: "إضافة جوز هند" },
    ]
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
    extras: [
      { name: "جبنة رومي إضافية", price: 8, description: "كمية إضافية من الجبنة الرومي" },
      { name: "طحينة إضافية", price: 3, description: "كمية إضافية من الطحينة" },
      { name: "زيتون", price: 5, description: "إضافة زيتون" },
    ]
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
    extras: [
      { name: "لحمة إضافية", price: 12, description: "كمية إضافية من اللحمة" },
      { name: "جبنة رومي", price: 8, description: "إضافة جبنة رومي" },
      { name: "بيض", price: 3, description: "إضافة بيض" },
    ]
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
    extras: [
      { name: "فراخ إضافية", price: 10, description: "كمية إضافية من الفراخ" },
      { name: "جبنة رومي", price: 8, description: "إضافة جبنة رومي" },
      { name: "خضار إضافية", price: 5, description: "خضار إضافية" },
    ]
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
    extras: [
      { name: "فراخ إضافية", price: 8, description: "كمية إضافية من الفراخ" },
      { name: "جبنة شيدر", price: 5, description: "إضافة جبنة شيدر" },
      { name: "صوص إضافي", price: 2, description: "صوص إضافي" },
    ]
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
    extras: [
      { name: "لحمة إضافية", price: 10, description: "كمية إضافية من اللحمة" },
      { name: "طحينة إضافية", price: 2, description: "طحينة إضافية" },
      { name: "صوص حار", price: 2, description: "صوص حار" },
    ]
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
    extras: [
      { name: "كفتة إضافية", price: 8, description: "كمية إضافية من الكفتة" },
      { name: "طحينة إضافية", price: 2, description: "طحينة إضافية" },
      { name: "صوص حار", price: 2, description: "صوص حار" },
    ]
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
    extras: [
      { name: "فلافل إضافي", price: 3, description: "فلافل إضافي" },
      { name: "طحينة إضافية", price: 2, description: "طحينة إضافية" },
      { name: "صوص حار", price: 2, description: "صوص حار" },
    ]
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
    extras: [
      { name: "لحمة إضافية", price: 12, description: "كمية إضافية من اللحمة" },
      { name: "جبنة شيدر", price: 5, description: "إضافة جبنة شيدر" },
      { name: "صوص إضافي", price: 2, description: "صوص إضافي" },
    ]
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
    extras: [
      { name: "نوتيلا إضافية", price: 5, description: "كمية إضافية من النوتيلا" },
      { name: "موز إضافي", price: 3, description: "موز إضافي" },
      { name: "فراولة", price: 4, description: "إضافة فراولة" },
    ]
  },
  {
    id: "crepes-2",
    name: "كريب فراخ",
    category: "crepes",
    description: "كريب مالح بقطع الفراخ والخضار",
    prices: {
      regular: 25,
    },
    image: "/images/menu/chicken-crepe.jpg",
    available: true,
    extras: [
      { name: "فراخ إضافية", price: 8, description: "كمية إضافية من الفراخ" },
      { name: "جبنة شيدر", price: 5, description: "إضافة جبنة شيدر" },
      { name: "صوص إضافي", price: 2, description: "صوص إضافي" },
    ]
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
    name: "فراخ مشوية",
    category: "grilled",
    description: "فراخ مشوية بالبهارات المصرية",
    prices: {
      quarter: 35,
      half: 60,
      full: 110,
    },
    image: "/images/menu/grilled-chicken.jpg",
    available: true,
    extras: [
      { name: "صوص إضافي", price: 2, description: "صوص إضافي" },
      { name: "سلطة خضار", price: 8, description: "سلطة خضار" },
      { name: "أرز أبيض", price: 8, description: "أرز أبيض" },
    ]
  },
  {
    id: "grilled-2",
    name: "كفتة مشوية",
    category: "grilled",
    description: "كفتة مشوية بالبهارات والثوم",
    prices: {
      regular: 45,
    },
    image: "/images/menu/grilled-kofta.jpg",
    available: true,
    extras: [
      { name: "صوص إضافي", price: 2, description: "صوص إضافي" },
      { name: "سلطة خضار", price: 8, description: "سلطة خضار" },
      { name: "أرز أبيض", price: 8, description: "أرز أبيض" },
    ]
  },
  {
    id: "grilled-3",
    name: "لحم مشوي",
    category: "grilled",
    description: "لحم بقري مشوي بالبهارات",
    prices: {
      regular: 80,
    },
    image: "/images/menu/grilled-beef.jpg",
    available: true,
    extras: [
      { name: "صوص إضافي", price: 2, description: "صوص إضافي" },
      { name: "سلطة خضار", price: 8, description: "سلطة خضار" },
      { name: "أرز أبيض", price: 8, description: "أرز أبيض" },
    ]
  },

  // Drinks
  {
    id: "drinks-1",
    name: "عصير برتقال طازج",
    category: "drinks",
    description: "عصير برتقال طازج طبيعي",
    prices: {
      small: 15,
      large: 25,
    },
    image: "/images/menu/orange-juice.jpg",
    available: true,
    extras: [
      { name: "ثلج إضافي", price: 1, description: "ثلج إضافي" },
      { name: "سكر إضافي", price: 1, description: "سكر إضافي" },
    ]
  },
  {
    id: "drinks-2",
    name: "عصير مانجو",
    category: "drinks",
    description: "عصير مانجو طازج وطبيعي",
    prices: {
      small: 18,
      large: 28,
    },
    image: "/images/menu/mango-juice.jpg",
    available: true,
    extras: [
      { name: "ثلج إضافي", price: 1, description: "ثلج إضافي" },
      { name: "سكر إضافي", price: 1, description: "سكر إضافي" },
    ]
  },
  {
    id: "drinks-3",
    name: "شاي مصري",
    category: "drinks",
    description: "شاي مصري تقليدي",
    prices: {
      regular: 8,
    },
    image: "/images/menu/egyptian-tea.jpg",
    available: true,
    extras: [
      { name: "سكر إضافي", price: 1, description: "سكر إضافي" },
      { name: "ليمون", price: 2, description: "إضافة ليمون" },
    ]
  },
  {
    id: "drinks-4",
    name: "قهوة تركية",
    category: "drinks",
    description: "قهوة تركية تقليدية",
    prices: {
      regular: 12,
    },
    image: "/images/menu/turkish-coffee.jpg",
    available: true,
    extras: [
      { name: "سكر إضافي", price: 1, description: "سكر إضافي" },
      { name: "هيل", price: 2, description: "إضافة هيل" },
    ]
  },
  {
    id: "drinks-5",
    name: "كولا",
    category: "drinks",
    description: "مشروب غازي",
    prices: {
      small: 8,
      large: 12,
    },
    image: "/images/menu/cola.jpg",
    available: true,
    extras: [
      { name: "ثلج إضافي", price: 1, description: "ثلج إضافي" },
    ]
  },

  // Pasta
  {
    id: "pasta-1",
    name: "مكرونة بالصلصة البيضاء",
    category: "pasta",
    description: "مكرونة مع صلصة الكريمة والجبنة",
    prices: {
      regular: 40,
    },
    image: "/images/menu/white-pasta.jpg",
    available: true,
    extras: [
      { name: "جبنة مبشورة", price: 5, description: "جبنة مبشورة" },
      { name: "فراخ مشوية", price: 15, description: "إضافة فراخ مشوية" },
      { name: "صوص إضافي", price: 2, description: "صوص إضافي" },
    ]
  },
  {
    id: "pasta-2",
    name: "مكرونة بالصلصة الحمراء",
    category: "pasta",
    description: "مكرونة مع صلصة الطماطم واللحم المفروم",
    prices: {
      regular: 45,
    },
    image: "/images/menu/red-pasta.jpg",
    available: true,
    extras: [
      { name: "جبنة مبشورة", price: 5, description: "جبنة مبشورة" },
      { name: "لحم إضافي", price: 12, description: "لحم إضافي" },
      { name: "صوص إضافي", price: 2, description: "صوص إضافي" },
    ]
  },

  // Rice
  {
    id: "rice-1",
    name: "أرز بالدجاج",
    category: "rice",
    description: "أرز مصري مع قطع الدجاج والخضار",
    prices: {
      regular: 35,
    },
    image: "/images/menu/chicken-rice.jpg",
    available: true,
    extras: [
      { name: "فراخ إضافية", price: 10, description: "فراخ إضافية" },
      { name: "صوص إضافي", price: 2, description: "صوص إضافي" },
    ]
  },
  {
    id: "rice-2",
    name: "أرز باللحم",
    category: "rice",
    description: "أرز مصري مع اللحم المفروم والخضار",
    prices: {
      regular: 40,
    },
    image: "/images/menu/beef-rice.jpg",
    available: true,
    extras: [
      { name: "لحم إضافي", price: 12, description: "لحم إضافي" },
      { name: "صوص إضافي", price: 2, description: "صوص إضافي" },
    ]
  },

  // Desserts
  {
    id: "desserts-1",
    name: "كنافة",
    category: "desserts",
    description: "كنافة تقليدية مع الجبنة والمكسرات",
    prices: {
      regular: 25,
    },
    image: "/images/menu/kunafa.jpg",
    available: true,
    extras: [
      { name: "عسل إضافي", price: 3, description: "عسل إضافي" },
      { name: "مكسرات إضافية", price: 5, description: "مكسرات إضافية" },
    ]
  },
  {
    id: "desserts-2",
    name: "بسبوسة",
    category: "desserts",
    description: "بسبوسة تقليدية مع جوز الهند",
    prices: {
      regular: 20,
    },
    image: "/images/menu/basbousa.jpg",
    available: true,
    extras: [
      { name: "عسل إضافي", price: 3, description: "عسل إضافي" },
      { name: "جوز هند إضافي", price: 2, description: "جوز هند إضافي" },
    ]
  },
  {
    id: "desserts-3",
    name: "أم علي",
    category: "desserts",
    description: "أم علي تقليدية مع المكسرات والقشدة",
    prices: {
      regular: 30,
    },
    image: "/images/menu/um-ali.jpg",
    available: true,
    extras: [
      { name: "قشدة إضافية", price: 5, description: "قشدة إضافية" },
      { name: "مكسرات إضافية", price: 5, description: "مكسرات إضافية" },
    ]
  },

  // Extras
  {
    id: "extras-1",
    name: "طبق بطاطس",
    category: "extras",
    description: "بطاطس مقلية طازجة مع صلصة خاصة",
    prices: {
      small: 15,
      large: 25,
    },
    image: "/images/menu/french-fries.jpg",
    available: true,
    extras: [
      { name: "صوص إضافي", price: 2, description: "صوص إضافي" },
      { name: "جبنة مبشورة", price: 5, description: "جبنة مبشورة على البطاطس" },
      { name: "صوص حار", price: 2, description: "صوص حار" },
    ]
  },
  {
    id: "extras-2",
    name: "سلطة خضار",
    category: "extras",
    description: "سلطة خضار طازجة مع زيت الزيتون والليمون",
    prices: {
      regular: 20,
    },
    image: "/images/menu/vegetable-salad.jpg",
    available: true,
    extras: [
      { name: "زيتون إضافي", price: 3, description: "زيتون إضافي" },
      { name: "جبنة فيتا", price: 5, description: "إضافة جبنة فيتا" },
      { name: "صوص إضافي", price: 2, description: "صوص إضافي" },
    ]
  },
  {
    id: "extras-3",
    name: "أرز أبيض",
    category: "extras",
    description: "أرز أبيض مطبوخ بالطريقة المصرية",
    prices: {
      regular: 12,
    },
    image: "/images/menu/white-rice.jpg",
    available: true,
    extras: [
      { name: "صوص إضافي", price: 2, description: "صوص إضافي" },
      { name: "زبد", price: 3, description: "إضافة زبد" },
    ]
  },
  {
    id: "extras-4",
    name: "مكرونة",
    category: "extras",
    description: "مكرونة إيطالية مع صلصة الطماطم",
    prices: {
      regular: 18,
    },
    image: "/images/menu/pasta.jpg",
    available: true,
    extras: [
      { name: "جبنة مبشورة", price: 5, description: "جبنة مبشورة" },
      { name: "صوص إضافي", price: 2, description: "صوص إضافي" },
    ]
  },
  {
    id: "extras-5",
    name: "حساء خضار",
    category: "extras",
    description: "حساء خضار طازج ومغذي",
    prices: {
      regular: 15,
    },
    image: "/images/menu/vegetable-soup.jpg",
    available: true,
    extras: [
      { name: "خبز محمص", price: 3, description: "خبز محمص" },
      { name: "صوص إضافي", price: 2, description: "صوص إضافي" },
    ]
  },
  {
    id: "extras-6",
    name: "خبز محمص",
    category: "extras",
    description: "خبز محمص طازج",
    prices: {
      regular: 5,
    },
    image: "/images/menu/toasted-bread.jpg",
    available: true,
    extras: [
      { name: "زبد", price: 2, description: "إضافة زبد" },
      { name: "صوص إضافي", price: 2, description: "صوص إضافي" },
    ]
  },
  {
    id: "extras-7",
    name: "صوص حار",
    category: "extras",
    description: "صوص حار تقليدي",
    prices: {
      regular: 3,
    },
    image: "/images/menu/hot-sauce.jpg",
    available: true,
    extras: []
  },
  {
    id: "extras-8",
    name: "صوص طماطم",
    category: "extras",
    description: "صوص طماطم طازج",
    prices: {
      regular: 3,
    },
    image: "/images/menu/tomato-sauce.jpg",
    available: true,
    extras: []
  },
]
