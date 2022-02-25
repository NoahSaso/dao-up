# Updating a campaign

After a campaign is created, the fundraising DAO may want to update
information about the campaign. This occurs through a proposal.

Note that only the fundraising DAO may update a campaign's
configuration, not the wallet that created the campaign initially.

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
