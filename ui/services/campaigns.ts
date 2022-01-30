export const campaigns: Campaign[] = [
  {
    id: "1",
    name: "BongDAO",
    description: "Lorem ipsum dolor sit amet, egestas...",
    open: true,

    asset: "$JUNO",
    goal: 100000,
    pledged: 10000,
    supporters: 10,
    supply: 100000,

    website: "https://noahsaso.com",
    twitter: "NoahSaso",
    discord: "test",

    activity: [
      {
        when: new Date(new Date().getTime() - 1 * 60 * 60 * 24 * 7),
        address: "123",
        amount: 2,
        asset: "$JUNO",
      },
      {
        when: new Date(new Date().getTime() - 5000 * 60 * 60 * 24 * 7),
        address: "123456",
        amount: 1,
        asset: "$JUNO",
      },
      {
        when: new Date(new Date().getTime() - 10000 * 60 * 60 * 24 * 7),
        address: "3",
        amount: 1,
        asset: "$JUNO",
      },
    ],
  },
  {
    id: "2",
    name: "HouseDAO",
    description: "Lorem ipsum dolor sit amet, egestas...",
    open: true,

    asset: "$JUNO",
    goal: 1000000,
    pledged: 700000,
    supporters: 7,
    supply: 1000000,

    activity: [],
  },
  {
    id: "3",
    name: "RentDAO",
    description: "Lorem ipsum dolor sit amet, egestas...",
    open: true,

    asset: "$JUNO",
    goal: 500000,
    pledged: 200000,
    supporters: 200,
    supply: 1000000,

    activity: [],
  },
  {
    id: "4",
    name: "GroceryDAO",
    description: "Lorem ipsum dolor sit amet, egestas...",
    open: true,

    asset: "$JUNO",
    goal: 1000000,
    pledged: 900000,
    supporters: 45,
    supply: 1000000,

    activity: [],
  },
  {
    id: "5",
    name: "MicroGridDAO",
    description: "Lorem ipsum dolor sit amet, egestas...",
    open: true,

    asset: "$JUNO",
    goal: 1000000,
    pledged: 1200000,
    supporters: 8,
    supply: 1200000,

    activity: [],
  },
]
