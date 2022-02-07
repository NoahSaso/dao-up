# DAO Up! Smart Contracts

DAO Up! consists of two contracts. The first is a slightly modified
cw20 contract that allows the minter to be updated by the current
minter. The second is an escrow contract which accepts funds,
distributes governance tokens, and upon campaign completion
instantiates a DAO which uses the governance token.

## CW20 Updatable Minter

This modified cw20 contract is required as the escrow contract must be
able to mint tokens and then pass those minting rights along to the
DAO. This gives created DAOs the ability to mint their governance
token.

To prevent the case where the minter circumvents a minting limit by
reassigning minting rights to themselves after the contract is
instantiated the minting cap may not be changed, only the address
allowed to do that minting.

## Escrow

The escrow contract is instantiated with a funding goal, a token price
(in tokens / native coin), and some information about contract code
IDs and the campaign which are used by the frontend and to instantiate
the needed contracts.

The contract then serves as a token sale contract except once the
funding goal has been reached sales may be stopped by the campaign
creator by executing a close message. Upon receiving a valid close
message the escrow contract will instantiate a new DAO DAO DAO using
the cw20 token that it has been selling.

Once the DAO has been created any address may execute a transfer
message which will cause the escrow contract to send all of its funds
to the instantiated DAO and transfer token minting rights to said DAO.

These two methods are seperated to avoid contract complexity that
emerges from initiating the transfer from the reply to the DAO
instantiation message. I could be convinced they ought to be the same
message.

Any time before the completion of the campaign the escrow contract
will also return funds to users who send their tokens to the escrow
contract. Refund amounts are always rounded down so you can't sneakily
print money by sending interesting refund amounts.

Upon completion of the campaign one can query the escrow contract to
learn the address of the instantiated DAO DAO DAO.
