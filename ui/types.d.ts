interface ActivityItem {
  when: Date
  address: string
  amount: number
  asset: string
}

interface Campaign {
  id: string
  name: string
  description: string
  imageUrl?: string

  website?: string
  twitter?: string
  discord?: string

  asset: string
  goal: number
  pledged: number
  supporters: number
  supply: number

  activity: ActivityItem[]
}
