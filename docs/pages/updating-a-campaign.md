# Updating a campaign

After a campaign is created, the fundraising DAO may want to update
information about the campaign. This occurs through a proposal, so
we tried to make it pretty easy for you to create an update proposal
on the DAO Up! UI.

Note that only the fundraising DAO may update a campaign's
configuration, not the wallet that initially created the campaign.

## Creating the proposal via the DAO Up! UI

If you have governance tokens in the DAO, a pencil icon should appear
on the campaign page near the funding progress. Pressing this will open
a form with the current campaign details already filled in.

Submitting the form will create a proposal in your DAO, and DAO members
will be able to vote on the proposal. Once it is passed and executed,
the campaign details will update immediately.

You can also create the proposal manually via the
[DAO DAO](https://daodao.zone/) UI.

## Creating the proposal manually

To create the proposal manually, the fundraising DAO needs to
execute the `update_campaign` method on the campaign contract address.

```json
{
  "wasm": {
    "execute": {
      "contract_addr": "CAMPAIGN_ADDRESS_BETWEEN_THESE_QUOTES",
      "msg": {
        "update_campaign": {
          "campaign": {
            "name": "NEW_CAMPAIGN_NAME",
            "description": "NEW_CAMPAIGN_DESCRIPTION",
            "hidden": false,
            "profile_image_url": "CAMPAIGN_PROFILE_IMAGE_URL",
            "description_image_urls": [
              "CAMPAIGN_DESCRIPTION_IMAGE_URL_1",
              "CAMPAIGN_DESCRIPTION_IMAGE_URL_2"
            ],
            "twitter": "CAMPAIGN_TWITTER_HANDLE",
            "website": "CAMPAIGN_WEBSITE_URL",
            "discord": "CAMPAIGN_DISCORD_URL"
          }
        }
      },
      "funds": []
    }
  }
}
```

You can find the address of your campaign by looking in the URL bar of
your browser while viewing the campaign. The URL will be in the form
`https://daoup.zone/campaign/CAMPAIGN_ADDRESS_AT_THE_END`.

Likely, campaign creators will not want to update all of the fields in
their campaign. To get the current campaign config, you need to
[setup junod](https://docs.junonetwork.io/smart-contracts-and-junod-development/junod-local-dev-setup).
Then, run:

```bash
junod query wasm contract-state smart CAMPAIGN_CONTRACT_ADDRESS_HERE '{"dump_state": {}}' --output json | jq '.data.campaign_info'
```

You will then want to copy the campaign object shown in that
command's output into the proposal message field and update only the
fields you want.
