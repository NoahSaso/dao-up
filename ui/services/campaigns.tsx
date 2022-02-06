import { prettyPrintDecimal } from "../helpers/number"
import { Status } from "../types"

const renderString = (v: string) => v
const renderBoolean = (v: boolean) => (v ? "Yes" : "No")
const makeRenderNumber =
  (maxDecimals?: number, minDecimals?: number) => (v: number) =>
    prettyPrintDecimal(v, maxDecimals, minDecimals)

const renderImageUrl = (imageUrl?: string) => (
  <>
    {imageUrl}
    {!!imageUrl && (
      // image is being loaded from anywhere, so can't use next image component
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt="" className="mt-2 max-w-[14rem]" />
    )}
  </>
)

export const newCampaignFields: Record<NewCampaignFieldKey, NewCampaignField> =
  {
    name: {
      label: "Name",
      pageId: 1,
      required: true,
      render: renderString,
    },
    description: {
      label: "Description",
      pageId: 1,
      required: true,
      render: renderString,
    },
    imageUrl: {
      label: "Image URL",
      pageId: 1,
      required: false,
      render: renderImageUrl,
    },
    goal: {
      label: "Funding Target",
      pageId: 1,
      required: true,
      unitBefore: (_) => "$",
      render: makeRenderNumber(2, 2),
    },
    daoAddress: {
      label: "DAO Address",
      pageId: 1,
      required: true,
      render: makeRenderNumber(2, 2),
    },
    hidden: {
      label: "Hide from public campaigns list",
      pageId: 1,
      required: false,
      render: renderBoolean,
    },
    website: {
      label: "Website",
      pageId: 1,
      required: false,
      render: renderString,
    },
    twitter: {
      label: "Twitter",
      pageId: 1,
      required: false,
      render: renderString,
    },
    discord: {
      label: "Discord",
      pageId: 1,
      required: false,
      render: renderString,
    },
  }
export const newCampaignFieldEntries = Object.entries(newCampaignFields) as [
  NewCampaignFieldKey,
  NewCampaignField
][]

export const defaultNewCampaign: Partial<NewCampaign> = {
  hidden: false,
}

const placeholderCampaignFields = {
  status: Status.Active,

  daoUrl: "https://noahsaso.com",
  hidden: false,

  tokenName: "Token",
  tokenSymbol: "TOK",
  tokenPrice: 1,

  initialSupply: 10000000,
}

export const campaigns: Campaign[] = [
  {
    ...placeholderCampaignFields,

    address: "junoescrow1",
    daoAddress: "junodao1",
    name: "BongDAO",
    description: "Lorem ipsum dolor sit amet, egestas...",
    creator: "junowallet1",

    goal: 100000,
    pledged: 10000,
    supporters: 10,
    supply: 100000,

    website: "https://noahsaso.com",
    twitter: "NoahSaso",
    discord: "test",
    imageUrl: "https://moonphase.is/image.svg",

    activity: [
      {
        when: new Date(new Date().getTime() - 1 * 60 * 60 * 24 * 7),
        address: "123",
        amount: 2,
      },
      {
        when: new Date(new Date().getTime() - 5000 * 60 * 60 * 24 * 7),
        address: "123456",
        amount: 1,
      },
      {
        when: new Date(new Date().getTime() - 10000 * 60 * 60 * 24 * 7),
        address: "3",
        amount: 1,
      },
    ],
  },
  {
    ...placeholderCampaignFields,

    address: "junoescrow2",
    daoAddress: "junodao2",
    name: "HouseDAO",
    description: "Lorem ipsum dolor sit amet, egestas...",
    creator: "junowallet1",

    goal: 1000000,
    pledged: 700000,
    supporters: 7,
    supply: 1000000,

    imageUrl: "https://moonphase.is/image.svg",

    activity: [],
  },
  {
    ...placeholderCampaignFields,

    address: "junoescrow3",
    daoAddress: "junodao3",
    name: "RentDAO",
    description: "Lorem ipsum dolor sit amet, egestas...",
    creator: "junowallet1",

    goal: 500000,
    pledged: 200000,
    supporters: 200,
    supply: 1000000,

    imageUrl: "https://moonphase.is/image.svg",

    activity: [],
  },
  {
    ...placeholderCampaignFields,

    address: "junoescrow4",
    daoAddress: "junodao4",
    name: "GroceryDAO",
    description: "Lorem ipsum dolor sit amet, egestas...",
    creator: "junowallet2",

    goal: 1000000,
    pledged: 900000,
    supporters: 45,
    supply: 1000000,

    imageUrl: "https://moonphase.is/image.svg",

    activity: [],
  },
  {
    ...placeholderCampaignFields,

    address: "junoescrow5",
    daoAddress: "junodao5",
    name: "MicroGridDAO",
    description: "Lorem ipsum dolor sit amet, egestas...",
    creator: "junowallet2",

    goal: 1000000,
    pledged: 120000000000,
    supporters: 8,
    supply: 1200000,

    imageUrl: "https://moonphase.is/image.svg",

    activity: [],
  },
]
