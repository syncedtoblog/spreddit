#![no_std]
use soroban_auth::{Identifier, Signature};
use soroban_sdk::{contractimpl, contracttype, symbol, vec, Env, Symbol, Bytes, Vec, Map, log};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ArticleData {
    pub uri: Bytes,
    pub count: i32,
    pub descr: Bytes,
    pub created: u64,
    pub updated: u64
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


fn get_ledger_timestamp(e: &Env) -> u64 {
    e.ledger().timestamp()
}


pub struct SpredditContract;

#[contractimpl]
impl SpredditContract {


    pub fn vote(env: Env, uri : Bytes, amount: i32, descr: Bytes ) -> State {
        let mut state = Self::refr_state(env.clone());
        
        //nothing to do 
        if amount == 0 {
            return state
        }
       
        //I need to add the vote to the list.
        
        //Uri has already been submitted
        if state.articles.contains_key(uri.clone()) {

            //if new count is less than or equal to zero
            //remove from state
            if amount.checked_add(
                    state.articles.get_unchecked(uri.clone()).unwrap().count
                ).expect("no overflow") <= 0 {
                state.articles.remove(uri.clone());
            //else update state
            } else {
                state.articles.set(uri.clone(), 
                    ArticleData { 
                        uri: uri.clone(), 
                        count: amount.checked_add(
                                   state.articles.get_unchecked(uri.clone()).unwrap().count
                               ).expect("no overflow"), 
                        descr: state.articles.get_unchecked(uri.clone()).unwrap().descr,
                        created: state.articles.get_unchecked(uri.clone()).unwrap().created,
                        updated: get_ledger_timestamp(&env)
                    }
                );
            }

            //create event for any subscribers
            if amount > 0 {
                env.events().publish((UPVOTE,), (uri.clone(),amount,state.clone()) );
            } else {
                env.events().publish((DOWNVOTE,), (uri.clone(),amount,state.clone()) );
            }

        //New submission
        } else if amount > 0 {
            let tstamp = get_ledger_timestamp(&env);
            state.articles.set(uri.clone(), 
                ArticleData { 
                    uri: uri.clone(), 
                    count: amount,
                    descr: descr.clone(),
                    created: tstamp,
                    updated: tstamp
                }
            );
            //create event for any subscribers
            env.events().publish((SUBMIT,), (uri.clone(),amount,state.clone()) );
        }

        // Save the data.
        env.storage().set(STATE, &state);
        // Return the new data to the caller.
        state
    }


    // Return the current voting state.
    pub fn refr_state(env: Env) -> State {
        env.storage()
            .get(STATE)
            .unwrap_or_else(|| Ok(State::default(&env))) // If no value set, assume 0.
            .unwrap() // Panic if the value of COUNTER is not a State.
    }
}



mod test;
