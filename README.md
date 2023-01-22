# Spreddit
A blockchain-based Reddit clone using Stellar Soroban


## Inspiration



## What it does
Spreddit's Dapp runs on Stellar Futurenet, and voters spend XLM to upvote/downvote/post links. 


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

    soroban invoke     --id b9773ba1c8c2d9ad9369c628a016252f21297491e09c125d790d07b7ce0789e8     --secret-key SCZITBDDWLHWQZGIEYET4E4R4F2RYRCT4ZTSJ7VMVG2L6WJHTP2T7BZR     --rpc-url http://localhost:8000/soroban/rpc     --network-passphrase 'Test SDF Future Network ; October 2022'     --fn vote --arg "[104, 116, 116, 112, 115, 58, 47, 47, 115, 121, 110, 99, 101, 100, 46, 116, 111]" --arg 56

    soroban invoke     --id b9773ba1c8c2d9ad9369c628a016252f21297491e09c125d790d07b7ce0789e8     --secret-key SCZITBDDWLHWQZGIEYET4E4R4F2RYRCT4ZTSJ7VMVG2L6WJHTP2T7BZR     --rpc-url http://localhost:8000/soroban/rpc     --network-passphrase 'Test SDF Future Network ; October 2022'     --fn get_state


## Challenges we ran into
I couldn't find any docs on parsing the contract data ledger entry in JS, I suspect there's functionality in SorobanClient.xdr, but I ended up writing something rough myself. Similarly there's no docs on how to prep arguments to send to smart contracts via Soroban JS client. I found some stuff in the example dapp, but it was not easy to digest.

Related to the above, was figuring out how to add a footprint to the JS calls. I wouldn't have figured this out without the help of the [Soroban Pixelwar dev](https://github.com/candela-network/soroban-pixelwar) - many thanks!

It would be great to have a way for a smart contract to be executed periodically, either by itself or by another looper smart contract. At the moment refreshing Spreddit vote state would need to be done off-chain e.g. by a cron job invoking the contract function.  

Info on floats would be nice (though I understand using floats on blockchain might be a challenge). I saw in the example dapp they use bigNumber to encode. But not sure how it works on the smart contract side. I'd like to write up an example on how to do this in the future actually.


## Accomplishments that we're proud of
Creating an end-to-end example of a simple DAO-like structure using Soroban, from the smart contract through to the UI for interaction with it. 


## What we learned
How to use Soroban smart contracts end-to-end.


## What's next for Spreddit
I'm looking to integrate ideas from Spreddit into the geo-dashboards and bounties component of our existing SCF Project - eventually to have a DAO-like structure for community management of a local area. For Spreddit itself - if anyone fancies building on top of it, they should go for it!









