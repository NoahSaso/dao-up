# Creating a new campaign

Here we'll walk through the process of creating a new campaign on DAO
Up! To create a fundraising campaign, you'll need an existing DAO on
[DAO DAO](https://daodao.zone).

## Creating a campaign for your DAO DAO DAO

Start by navigating to the DAO Up! campaign [creation
page](https://daoup.zone/create). Once you're there, fill in the
details of your campaign.

The campaign token is the token your backers will be issued when
they contribute to the campaign. Before you reach your funding goal,
backers are able to exchange that token with the DAO Up! smart
contracts for their money back. After you reach your goal, backers
will exchange the funding token for governance tokens in your DAO.

Once you complete the campaign creation, you should be redirected to a
page showing your campaign. The campaign status will be "Pending".

### Starting the campaign

In order to move the campaign out of a pending state, you'll need to
send it some governance tokens.

To do this, you'll need to create a proposal in your DAO. You can
either do this via the DAO Up! UI or manually from your DAO's page on
DAO DAO.

## Creating the proposal via the DAO Up! UI

We've tried to make this pretty simple.

Once you've created your campaign, you'll be directed to a page
displaying your campaign and its status. Find the box prompting you to
create a proposal, input the number of tokens you would like to
allocate to the campaign, and press the "Propose" button.

The proposal will be created in your DAO with a default
description, and DAO members will be able to vote on the proposal.
Once it is passed and executed, your campaign will become active and
ready to accept funding.

If you'd like a little more manual control over the proposal, consider
creating the proposal manually.

## Creating the proposal manually

This method is a little more complex but gives you more
flexibility. For example, using this method, you could add a mint
message to your proposal that would mint new governance tokens to
allocate towards the crowdfunding campaign instead of just sending
existing ones.

To activate your campaign, navigate to your DAO's page on [DAO
DAO](https://daodao.zone) and create a new proposal. With this
proposal, we'll be sending governance tokens from the DAO to the
campaign smart contract. To do this, add a custom message to your
proposal with the following contents:

```json
{
  "wasm": {
    "execute": {
      "contract_addr": "DAO_GOV_TOKEN_ADDRESS",
      "msg": {
        "send": {
          "contract": "CAMPAIGN_ADDRESS_FROM_URL",
          "amount": "GOV_TOKENS_TO_SEND",
          "msg": ""
        }
      },
      "funds": []
    }
  }
}
```

Make sure to replace the text in capital letters above with
the appropriate addresses and amounts for your DAO and escrow
contract. You can find your DAO's governance token address in the
"Treasury" section of your DAO's page on DAO DAO and the campaign
address in the URL of your campaign's page.

When filling in the amount field, ensure you account for the number of
decimals your token has by multiplying by the appropriate order of
magnitude. Decimals are invented by UIs so that you can send fractions
of one token; they don't actually exist on the blockchain. If a token
has N decimals, the smallest denomination of token on the chain is actually
`10 ** -N`.

If you created a new token via the DAO DAO UI, it will
have six decimals. This means that the amount field should be
`tokens_to_send * 10**6`, because each token on the UI is actually 10\*\*6
tokens on the blockchain. For more information about decimals and tokens,
see the CosmWasm [cw20 spec](https://github.com/CosmWasm/cw-plus/blob/main/packages/cw20/README.md#base).

When selecting the number of governance tokens to send, consider that
your backers want to participate in DAO governance. Send enough tokens
to make this possible.

### Funding the campaign

After your proposal is voted on and executed, your campaign will be in
the "Active" status on DAO Up!. Backers will be able to contribute to
and interact with your new campaign.

Congrats! Go out and tell your friends and community what you're
building. We can't wait to see what you create :)
