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
    
    let description = "Crowdsourced geospatial data".as_bytes(); 
    
    let new_state = client.vote(&Bytes::from_slice(&env, &uri), 
                                &100, &Bytes::from_slice(&env, &description));
    std::println!("New state: {:#?}", &new_state);

    assert_eq!(
        new_state.articles.get_unchecked(Bytes::from_slice(&env,&uri)).unwrap().count,
        100
    ); 
    assert_eq!(
        new_state.articles.get_unchecked(Bytes::from_slice(&env,&uri)).unwrap().descr,
        Bytes::from_slice(&env,&description)
    ); 
    assert_eq!(
        new_state.articles.get_unchecked(Bytes::from_slice(&env,&uri)).unwrap().uri,
        Bytes::from_slice(&env,&uri)
    ); 

    ()

}
