#![cfg(test)]

use super::*;
extern crate std;
use soroban_sdk::Bytes;


#[test]
fn test() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SpredditContract);
    let client = SpredditContractClient::new(&env, &contract_id);

    let state = client.refr_state();
    std::println!("State: {:#?}", &state);

    let uri = "https://synced.to".as_bytes(); 
    std::println!("uri: {:#?}", &uri);
    
    let new_state = client.vote(&Bytes::from_slice(&env, &uri), &10 );

    std::println!("New state: {:#?}", &new_state);

    ()

    /*
    assert_eq!(client.increment(&1), 1);
    assert_eq!(client.increment(&10), 11);
    assert_eq!(
        client.refr_state(),
        State {
            count: 11,
            last_incr: 10
        }
    );
    */
}
