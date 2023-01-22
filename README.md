# spreddit
Blockchain-based Reddit using Stellar Soroban



docker run --rm -it   -p 8000:8000   --name stellar   stellar/quickstart:soroban-dev   --futurenet   --enable-soroban-rpc


soroban invoke     --id b9773ba1c8c2d9ad9369c628a016252f21297491e09c125d790d07b7ce0789e8     --secret-key SCZITBDDWLHWQZGIEYET4E4R4F2RYRCT4ZTSJ7VMVG2L6WJHTP2T7BZR     --rpc-url http://localhost:8000/soroban/rpc     --network-passphrase 'Test SDF Future Network ; October 2022'     --fn vote --arg "[104, 116, 116, 112, 115, 58, 47, 47, 115, 121, 110, 99, 101, 100, 46, 116, 111]" --arg 56


soroban invoke     --id b9773ba1c8c2d9ad9369c628a016252f21297491e09c125d790d07b7ce0789e8     --secret-key SCZITBDDWLHWQZGIEYET4E4R4F2RYRCT4ZTSJ7VMVG2L6WJHTP2T7BZR     --rpc-url http://localhost:8000/soroban/rpc     --network-passphrase 'Test SDF Future Network ; October 2022'     --fn get_state
