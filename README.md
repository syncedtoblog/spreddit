# Spreddit
A blockchain-based Reddit clone using Stellar Soroban


## Inspiration
I wanted to explore how we might use Soroban for DAO-like structures in our SCF Geo-bounties project. So this project is mainly a learning experience. 

The inspiration for a Soroban-based Reddit was based on hearing Alexis Ohanian (Reddit founder) talk at Meridian.


## What it does
Spreddit's Dapp runs on Stellar Futurenet, and voters spend XLM to upvote/downvote/post links. 

*TODO: I couldn't figure out how to use the Stellar Asset Contract to transfer XLM in time for the hackathon. I'd like to add this once I know how to do it.*

## How we built it
Spreddit state is stored in a Soroban smart contract, while a React client uses [js-soroban-client](https://github.com/stellar/js-soroban-client) to give a UI for users to interact with the smart contract.


## How to run it
To run your own Soroban RPC node, use the below Docker command and point the Spreddit UI to `http://localhost:8000/soroban/rpc`

    docker run --rm -it   -p 8000:8000   --name stellar   stellar/quickstart:soroban-dev   --futurenet   --enable-soroban-rpc

To start the spreddit Node server to run the UI, from the project root run

    cd spreddit-app
    npm install
    npm start

and then go to `http://localhost:3000` in your browser

If you want to trial Soroban functions on the futurenet contract, use the below Soroban CLI commands

    soroban invoke     --id  780313cae6ded96516b096504de76079608701e2f173e526144bb1944023f902    --secret-key <Futurenet secret key> --rpc-url http://localhost:8000/soroban/rpc     --network-passphrase 'Test SDF Future Network ; October 2022'     --fn vote --arg "[104, 116, 116, 112, 115, 58, 47, 47, 115, 121, 110, 99, 101, 100, 46, 116, 111]" --arg 56 --arg "[]"

    soroban invoke     --id 780313cae6ded96516b096504de76079608701e2f173e526144bb1944023f902     --secret-key <Futurenet secret key>     --rpc-url http://localhost:8000/soroban/rpc     --network-passphrase 'Test SDF Future Network ; October 2022'     --fn refr_state


## Challenges we ran into
I wanted to use XLM as the base asset for simplicity. Users would spend XLM to vote. But I couldn't figure out how to use 
the Stellar Asset Contract in time. An example of how to use this would be really helpful!

I couldn't find any docs on parsing the contract data ledger entry in JS, I suspect there's functionality in SorobanClient.xdr, but I ended up writing something rough myself. Similarly there's no docs on how to prep arguments to send to smart contracts via Soroban JS client. I found some stuff in the example dapp, but it was not easy to digest.

Related to the above, was figuring out how to add a footprint to the JS calls. I wouldn't have figured this out without the help of the [Soroban Pixelwar dev](https://github.com/candela-network/soroban-pixelwar) - many thanks!

It would be great to have a way for a smart contract to be executed periodically, either by itself or by another looper smart contract. At the moment refreshing Spreddit vote state would need to be done off-chain e.g. by a cron job invoking the contract function.  

Info on floats would be nice (though I understand using floats on blockchain might be a challenge). I saw in the example dapp they use bigNumber to encode. But not sure how it works on the smart contract side. I'd like to write up an example on how to do this in the future actually.


## Accomplishments that we're proud of
Creating an end-to-end example of a simple DAO-like structure using Soroban, from the smart contract through to the UI for interaction with it. 


## What we learned
How to use Soroban smart contracts end-to-end.


## What's next for Spreddit
In the short term I'd like to figure out the Stellar Asset Contract to interact with the traditional Stellar assets (XLM), and actually have the voting XLM be transferred. I'd also like to build in a decay function so links gradually lose votes over time.

I'm looking to integrate ideas from Spreddit into the geo-dashboards and bounties component of our existing SCF Project - eventually to have a DAO-like structure for community management of a local area. For Spreddit itself - if anyone fancies building on top of it, they should go for it!









