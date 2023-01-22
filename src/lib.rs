#![no_std]
use soroban_sdk::{contractimpl, contracttype, symbol, vec, Env, Symbol, Bytes, Vec, Map, log};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ArticleData {
    pub uri: Bytes,
    pub count: i32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct State {
    pub articles: Map<Bytes,ArticleData>,
}

impl State {
    fn default(env: &Env) -> Self { 
        Self { articles: Map::new(env) }
    }
}


const SUBMIT: Symbol = symbol!("SUBMIT");
const UPVOTE: Symbol = symbol!("UPVOTE");
const DOWNVOTE: Symbol = symbol!("DOWNVOTE");
const STATE: Symbol = symbol!("STATE");


pub struct SpredditContract;

#[contractimpl]
impl SpredditContract {


    pub fn vote(env: Env, uri : Bytes, amount: i32 ) -> State {
        let mut state = Self::get_state(env.clone());
        
        //nothing to do 
        if amount == 0 {
            return state
        }
       
        //I need to add the vote to the list.
        //What happens if it's too low?
        if state.articles.contains_key(uri.clone()) {
            state.articles.set(uri.clone(), 
                ArticleData { 
                    uri: uri.clone(), 
                    count: amount.checked_add(
                               state.articles.get_unchecked(uri.clone()).unwrap().count
                           ).expect("no overflow") 
                }
            );
            if amount > 0 {
                env.events().publish((UPVOTE,), state.clone());
            } else {
                env.events().publish((DOWNVOTE,), state.clone());
            }
        } else {
            state.articles.set(uri.clone(), 
                ArticleData { 
                    uri: uri.clone(), 
                    count: amount
                }
            );
            env.events().publish((SUBMIT,), state.clone());
        }

        // Save the data.
        env.storage().set(STATE, &state);
        // Return the new data to the caller.
        state
    }


    /// Return the current voting state.
    //fn update_state_counts(state: &State) -> State {
        //
    //}



    /// Return the current voting state.
    pub fn get_state(env: Env) -> State {
        env.storage()
            .get(STATE)
            .unwrap_or_else(|| Ok(State::default(&env))) // If no value set, assume 0.
            .unwrap() // Panic if the value of COUNTER is not a State.
    }
}

//soroban invoke     --id b9773ba1c8c2d9ad9369c628a016252f21297491e09c125d790d07b7ce0789e8     --secret-key SCZITBDDWLHWQZGIEYET4E4R4F2RYRCT4ZTSJ7VMVG2L6WJHTP2T7BZR     --rpc-url http://localhost:8000/soroban/rpc     --network-passphrase 'Test SDF Future Network ; October 2022'     --fn vote --arg "[104, 116, 116, 112, 115, 58, 47, 47, 115, 121, 110, 99, 101, 100, 46, 116, 111]" --arg 56




mod test;
