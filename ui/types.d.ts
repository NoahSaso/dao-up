interface ActivityItem {
  when: Date
  address: string
  amount: string
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
