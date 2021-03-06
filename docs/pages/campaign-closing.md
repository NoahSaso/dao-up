# Closing a campaign

After a campaign is closed, the DAO creating the campaign will have
its governance tokens returned, and backers will be able to claim refunds.
**You cannot close a fully funded campaign. Closing means cancelling early.**

To close a campaign, navigate to your DAOs page on [DAO
DAO](https://daodao.zone) and create a new proposal. Fill in the title
and description of your proposal, and then add a custom message to the
proposal with the following contents:

```json
{
  "wasm": {
    "execute": {
      "contract_addr": "CAMPAIGN_ADDRESS_BETWEEN_THESE_QUOTES",
      "msg": {
        "close": {}
      },
      "funds": []
    }
  }
}
```

You can find the address of your campaign by looking in the URL bar of
your browser while viewing the campaign. The URL will be in the form
`https://daoup.zone/campaign/CAMPAIGN_ADDRESS_AT_THE_END`.

After voting on and executing the proposal, the campaign will close,
and governance tokens will be returned to the DAO.
