# CW20 Updatable Minter

This is an extension of the
[cw20-base](https://github.com/CosmWasm/cw-plus/tree/main/contracts/cw20-base)
contract which allows for the minter to be updated. Importantly,
changing the minter does not set the minting cap that is initially set
for the contract.

The added execute message is in the form:

```rust
UpdateMinter {
	minter: String
}
```
