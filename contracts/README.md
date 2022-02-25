# DAO Up! Smart Contracts

DAO Up! consists of a single escrow contract which handles refunds and
holds funds until a campaign reaches its funding goal.

The lifecycle of the escrow contract is as follows:

1. The contract is instantiated with information about the campaign.
2. The contract instantiates a new cw20 funding token.
3. Once the contract is instantiated the fundraising DAO sends
   governance tokens to the contract which opens the campaign.
4. Backers may send funds to the contract in exchange for governance
   tokens.
5. At any time before the campaign reaches its fundraising goal
   backers may exchange fundraising tokens for a full or partial
   refund.
6. Upon reaching its fundraising goal backers may exchange fundraising
   tokens for governance tokens in the DAO.
7. Once governance tokens are allocated the backers funds are sent to
   the DAO.
8. At any time before the campaign reaches its fundraising goal the
   fundraising DAO may close the campaign and have its governance
   tokens returned.
9. Backers may return fundraising tokens to a closed campaign for a
   refund.
