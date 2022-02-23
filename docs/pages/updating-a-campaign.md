# Updating a campaign

After a campaign is created the fundraising DAO may want to update
information about the campaign. To do this the fundraising DAO should
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
				"image_url": "CAMPAIGN_IMAGE_URL",
				"twitter": "CAMPAIGN_TWITER_HANDLE",
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

Note that only the fundraising DAO may update a campaign's
configuration.

You can find the address of your campaign by looking in the URL bar of
your browser while viewing the campaign. The URL will be in the form
`https://daoup.zone/campaign/CAMPAIGN_ADDRESS_AT_THE_END`.

Likely, campaign creators will not want to update all of the fields in
their campaign. To get the current campaign config run:

```bash
junod query wasm contract-state smart juno1yarv09jdpz5dfhrvjhna07sf3yuwsdf0xznl965qj0edh34df0ssanurd0 '{"dump_state": {}}' --output json | jq '.data.campaign_info'
```

You will then likely want to copy the campaign object shown in that
command's output into your messages campaign field and update only the
fields you deem needed.
