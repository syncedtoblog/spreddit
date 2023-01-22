import logo from './logo.png';
import loading from './loading.svg';
import './App.css';

//I don't actually use this as it uses unreliable Proxy for CORS
import { ReactTinyLink } from 'react-tiny-link'

//Icons
import {FaRegThumbsDown, FaRegThumbsUp, FaCommentDots } from "react-icons/fa"


import { useState, useEffect } from 'react';

var SorobanClient = require('soroban-client');
console.log(SorobanClient.Networks)
var xdr = SorobanClient.xdr
window.Buffer = require('buffer/').Buffer

const DEFAULT_SOROBAN_PATH = 'http://localhost:8000/soroban/rpc'
const SOROBAN_OPTS = {allowHttp: true}
const SPREDDIT_CONTRACTID = "b9773ba1c8c2d9ad9369c628a016252f21297491e09c125d790d07b7ce0789e8" 

//Since we store Soroban strings as Byte arrays, we need to convert between str and byte array
var bytesToStr = (bytesArr) => {
    // create an array view of some valid bytes
    let bytesView = new Uint8Array(bytesArr);
    // convert bytes to string
    // encoding can be specfied, defaults to utf-8 which is ascii.
    let str = new TextDecoder().decode(bytesView);
    console.log('bytesToStr',str)
    return str
}

var strToBytes = (str) => {
    let bytes2 = new TextEncoder().encode(str);
    return bytes2
}
//-----

//function to parse the contract data output data we get from Soroban
//I think it would make sense to make this more general in the future
var parse_soroban_output = (obj) => {

    if (obj.constructor.name == 'ChildUnion' && (obj._arm == 'sym' || obj._arm == 'bin') ) {
        return bytesToStr(obj['_value'])
    }
    else if (obj.constructor.name == 'ChildUnion' && obj._arm == 'obj' ) {
        return parse_soroban_output(obj['_value'])
    }
    else if (obj.constructor.name == 'ChildUnion' && obj._arm == 'map' ) {
        return obj['_value'].map(x => parse_soroban_output(x))
    }
    else if (obj.constructor.name == 'ChildUnion' && 
             ['u32','i32','u64','i64','u128','i128','bool'].includes( obj._arm ) ) {
        return obj['_value']
    }
    else if (obj.constructor.name == 'ChildUnion') {
        return {[obj['_arm']]: parse_soroban_output(obj['_value'])  }
    } 
    else if (obj.constructor.name == 'ChildStruct' ) {
        var attribs = obj._attributes
        if (attribs.hasOwnProperty('key') && attribs.hasOwnProperty('val')){
            return {[parse_soroban_output(attribs.key)]:parse_soroban_output(attribs.val)}
        } else { 
            return null
        }
    } 
    else {
        return null 
    }

}
//-----

//Helpful React UI components
var Panel = (props) => (
        <div style={{
                    ...{display: 'flex', flexDirection: 'column',
                     alignItems:'center', margin: '0 auto', position:'relative'},
                    ...(props.style ? props.style : {})
                    }}>
                {props.children}
                {props.footer ?
                        <Section style={props.footerStyle}>
                            {props.footer}
                        </Section> :
                        null}
        </div>
)

var Section = (props) => {

    return (
        <div 
            className={props.class ? props.class : props.className ? props.className : null}
            style={
            {...{padding: '10px', width: '100%',
                 maxWidth:'380px', marginBottom: '15px', backgroundColor:'white' },
             ...(props.style ? props.style : {})}
            }>
            {props.children}
        </div>
    )
}

var Overlay = (props) => {

    var overlay = (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, zIndex: 4000, height: '100vh',
                     backgroundColor: 'white'}}>
            <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5000,
                         backgroundColor: 'white'}}>
                <div style={{display:'flex', flexDirection: 'column', alignItems: 'stretch',
                             height: '100%'}}>
                    <div style={{flex: '1 1 auto'}} >
                        {props.children}
                    </div>
                </div>
            </div>
        </div>
    )

    return overlay
}



var XLMOptions = (props) => {

    var overlay = (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, zIndex: 4000, height: '100vh',
                     backgroundColor: 'white'}}>
            <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5000,
                         backgroundColor: 'white'}}>
                <div style={{display:'flex', flexDirection: 'column', alignItems: 'stretch',
                             height: '100%'}}>
                    <div style={{flex: '1 1 auto'}} >
                        {props.children}
                    </div>
                </div>
            </div>
        </div>
    )

    return overlay
}



//-----


//App entrypoint
function App() {

    var [loaded, setLoaded] = useState(false)
    var [sorobanState, setSorobanState] = useState(null)


    var [sorobanPath, setSorobanPath] = 
            useState('https://futurenet.sorobandev.com/soroban/rpc')
    var [sorobanPathInput, setSorobanPathInput] = 
            useState('https://futurenet.sorobandev.com/soroban/rpc')

    var [futurenetKey, setFuturenetKey] = useState(null)

    var [showPostOverlay, setShowPostOverlay] = useState(false)
    var [showRPCPathOverlay, setShowRPCPathOverlay] = useState(false)
    var [showInteractOverlay, setShowInteractOverlay] = useState(false)


    var [linkUrl, setLinkUrl] = useState(null)
    var [linkFunds, setLinkFunds] = useState(null)
    var [description, setDescription] = useState(null)
    var [postLinkPending, setPostLinkPending] = useState(false)
    var [postLinkError, setPostLinkError] = useState(false)
    


    var [commentFunds, setCommentFunds] = useState(null)
    var [comment, setComment] = useState(null)


    var loadSpredditSorobanState = () => {

        var server = new SorobanClient.Server(
                    sorobanPath ? sorobanPath : DEFAULT_SOROBAN_PATH,SOROBAN_OPTS);
        
        //fetching contract data
        const contractId = SPREDDIT_CONTRACTID;
        const key = xdr.LedgerKey.contractData(new xdr.LedgerKeyContractData({
          contractId: Buffer.from(contractId, "hex"),
          key: xdr.ScVal.scvSymbol("STATE"),
        }));
        server.getLedgerEntry(key).then(data => {

          var spreddit_state_outer = xdr.LedgerEntryData.fromXDR(data.xdr, 'base64')

          console.log("obj:",
             xdr.LedgerEntryData.fromXDR(data.xdr, 'base64')
          );
          console.log("obj:", 
              spreddit_state_outer.constructor.name,
              Object.getOwnPropertyNames(spreddit_state_outer)
          );
          console.log("obj_parsed:", 
              parse_soroban_output(spreddit_state_outer)
          );

          var toSet = null

          var spreddit_data_parsed = parse_soroban_output(spreddit_state_outer)
          if (spreddit_data_parsed.hasOwnProperty('contractData') &&
              spreddit_data_parsed.contractData.hasOwnProperty('STATE') && 
              spreddit_data_parsed.contractData.STATE.length > 0 &&
              spreddit_data_parsed.contractData.STATE[0].hasOwnProperty('articles') &&
              spreddit_data_parsed.contractData.STATE[0].articles.length > 0 
             ){

              console.log('parsing contract')
              console.log(spreddit_data_parsed.contractData.STATE[0].articles)
              var test = spreddit_data_parsed.contractData.STATE[0].articles.map(
                            x => x[Object.keys(x)[0]]
                        )
              console.log(test[0][1])
              toSet = spreddit_data_parsed.contractData.STATE[0].articles.map(
                        x => x[Object.keys(x)[0]]
                      )
                      .map(
                        x => { return {uri:x[1].uri, count: x[0].count }}
                      )

              console.log(toSet)
              toSet = toSet.sort((a, b) => b.count - a.count )
              console.log(toSet)
          }

          setSorobanState(toSet != null ? {'articles':toSet}  : null)

          console.log(Object.keys(xdr.LedgerEntryData.fromXDR(data.xdr, 'base64')))
          console.log("lastModified:", data.lastModifiedLedgerSeq);
          console.log("latestLedger:", data.latestLedger);
        }, err => {
            console.log(err)
        });




    }


    var setSpredditSorobanState = (spredditContractFn, spredditContractArgs ,
                                   onSuccess,onError) => {

        var server = new SorobanClient.Server(
                    sorobanPath ? sorobanPath : DEFAULT_SOROBAN_PATH,SOROBAN_OPTS);
       
        if (!futurenetKey){
            onError({'error': 'missing secret key'})
            return
        }
        
        // The source account is the account we will be signing and sending from.
        const sourceSecretKey = futurenetKey;

        // Derive Keypair object and public key (that starts with a G) from the secret
        var sourceKeypair
        var sourcePublicKey
        var contractId
        try {
            sourceKeypair = SorobanClient.Keypair.fromSecret(sourceSecretKey);
            sourcePublicKey = sourceKeypair.publicKey();
            contractId = SPREDDIT_CONTRACTID;
        } catch(err) {
            onError({'error': 'invalid futurenet secret key'})
            return
        }

        server.getAccount(sourcePublicKey).then((account)=>{
            let walletSource = new SorobanClient.Account(account.id, account.sequence)

            // Fee hardcoded for this example.
            const fee = 100;
            const contract = new SorobanClient.Contract(contractId);
            const transaction = new SorobanClient.TransactionBuilder(walletSource, 
                { fee, networkPassphrase: SorobanClient.Networks.FUTURENET })
                .addOperation(
                    // An operation to call increment on the contract
                    contract.call(spredditContractFn,...spredditContractArgs)
                )
                .setTimeout(SorobanClient.TimeoutInfinite)
                .build();
            // sign the transaction
            transaction.sign(SorobanClient.Keypair.fromSecret(sourceSecretKey));

            console.log(transaction)
            console.log(transaction.toXDR())

            server.sendTransaction(transaction).then((transactionResult)=>{
                console.log('got a transactionResult')
                console.log(transactionResult);
                onSuccess(transactionResult) 
            }).catch( (err) => {
                onError({'error': 'operation failed'})
                console.error(err);
            })
        }).catch( (err) => {
            onError({'error': 'account could not be retrieved'})
            console.error(err);
        })


    }


    // Similar to componentDidMount and componentDidUpdate:
    useEffect(() => {
        // Update the document title using the browser API
        loadSpredditSorobanState()
    },[sorobanPath]);



    var onPostLinkSubmit = () => {
        setPostLinkPending(true);  
        setPostLinkError(null); 

        
       
        /*
        setSpredditSorobanState('get_state', 
            [],
            () => {setPostLinkPending(false); setPostLinkError(null);},
            (err) => setPostLinkError(err)
        )*/

        
        setSpredditSorobanState('vote', 
            [SorobanClient.xdr.ScVal.scvObject(
                SorobanClient.xdr.ScObject.scoBytes(strToBytes(linkUrl))
             ),
             SorobanClient.xdr.ScVal.scvI32(Math.floor(linkFunds)) ],
            () => {setPostLinkPending(false); setPostLinkError(null);},
            (err) => setPostLinkError(err)
        )

    }



    return (
          <div className="container">
            <div className="row">
              <div className="twelve columns">
              <Panel>

                    <Section style={{textAlign: 'center'}}>
                        <img src={logo} style={{maxWidth: '150px'}} />
                        <h4>Spreddit</h4>
                        <p style={{marginBottom: '10px'}}>
                            A decentralized Reddit clone that uses Stellar's Soroban smart contracts.
                        </p>
                    </Section>
        

                    {showRPCPathOverlay ?
                    <Overlay>
                        <Panel style={{height: '100%'}}>
                            <Section style={{marginBottom: '10px'}}>
                                <div style={{textAlign: 'center', marginTop: '80px'}}>
                                    <h5>Set Soroban RPC server</h5>
                                    <input style={{width: '100%', marginBottom: '5px'}} 
                                           type="text" placeholder={DEFAULT_SOROBAN_PATH}
                                           value={sorobanPathInput ? sorobanPathInput : ''} 
                                           onChange={(e)=>setSorobanPathInput(
                                                   e.target.value.length > 0 ? e.target.value : null)}
                                    />
                                    <div style={{display: 'flex', 
                                                 flexDirection: 'row',
                                                 alignItems: 'center',
                                    }}>
                                        <button type="submit" className="button-lg"
                                            style={{width:'100%'}}
                                            onClick={()=> setShowRPCPathOverlay(false) } >
                                            Cancel
                                        </button>
                                        <div style={{width: '5px'}}></div>
                                        <button type="submit" className="button-lg" 
                                            style={{width:'100%'}}
                                            onClick={()=> {
                                                setSorobanPath(sorobanPathInput);
                                                setShowRPCPathOverlay(false);  
                                            }}
                                        >
                                            Set
                                        </button>
                                    </div>
                                </div>
                            </Section>
                        </Panel>
                    </Overlay> : null}


                    {showPostOverlay ?
                    <Overlay>
                        <Panel style={{height: '100%'}}>
                            <Section style={{marginBottom: '10px'}}>

                                {postLinkPending ? 
                                <div style={{textAlign: 'center', marginTop: '80px'}}>
                                    <img src={loading} style={{maxWidth: '150px'}} />
                                    {postLinkError ?
                                        <div style={{margin: '30px'}}>
                                            <p>{postLinkError.error}</p>
                                            <button type="submit" className="button-lg"
                                                style={{width:'100%'}}
                                                onClick={()=> { 
                                                    setPostLinkPending(false);
                                                    setPostLinkError(null);
                                                    setShowPostOverlay(false); 
                                                }} >
                                                OK
                                            </button>
                                        </div>
                                    : null}
                                </div>
                                :
                                <div style={{textAlign: 'center', marginTop: '80px'}}>
                                    
                                    <h5>Post a link to Spreddit</h5>

                                    <div style={{textAlign: 'left'}}>
                                        <label style={{fontWeight: 'normal'}}>
                                            Link URL 
                                            <span style={{color: '#ab4543'}}>{' (required)'}</span>
                                        </label>
                                        <input style={{width: '100%', marginBottom: '5px'}} 
                                               type="text" placeholder="Valid URL"
                                               value={linkUrl ? linkUrl : ''} 
                                               onChange={(e)=>setLinkUrl(
                                                   e.target.value.length > 0 ? e.target.value : null)}
                                        />

                                        <label style={{fontWeight: 'normal'}}>
                                           Seed funds
                                            <span style={{color: '#ab4543'}}>{' (required, must be in wallet)'}</span>
                                        </label>
                                        <input style={{width: '100%', marginBottom: '5px'}} 
                                               type="number" placeholder="XLM upvotes to seed link"
                                               value={linkFunds ? linkFunds : ''} 
                                               onChange={(e)=>setLinkFunds(
                                                   e.target.value.length > 0 ? e.target.value : null)}
                                        />


                                        <label style={{fontWeight: 'normal'}}>
                                            Add description
                                        </label>
                                        <textarea style={{width: '100%', marginBottom: '5px'}} 
                                               placeholder="Comment text"
                                               value={description ? description : ''} 
                                               onChange={(e)=>setDescription(
                                                   e.target.value.length > 0 ? e.target.value : null)}
                                        />
                                    </div>


                                    <div style={{display: 'flex', 
                                                 flexDirection: 'row',
                                                 alignItems: 'center',
                                    }}>
                                        <button type="submit" className="button-lg"
                                            style={{width:'100%'}}
                                            onClick={()=> setShowPostOverlay(false) } >
                                            Cancel
                                        </button>
                                        <div style={{width: '5px'}}></div>
                                        <button type="submit" className="button-lg" 
                                            style={{width:'100%'}}
                                            onClick={()=> {
                                                onPostLinkSubmit();
                                            }}
                                        >
                                            Submit
                                        </button>
                                    </div>
                                </div>}
                            </Section>
                        </Panel>
                    </Overlay> : null}




                    <Section style={{textAlign: 'center'}}>
                        <div style={{borderTop: '1px solid #cccccc', borderBottom: '1px solid #cccccc'}}>
                            <div>
                                <p style={{fontSize: '0.85em', fontStyle: 'italic'}}>
                                    {'I built this end-to-end Soroban demo to explore '}
                                    {'how we might create DAO-like structures for  '} 
                                    <a href="https://communityfund.stellar.org/projects/synced-geo-bounties">
                                    { 'our SCF project'}
                                    </a>.
                                </p>
                                <p style={{marginBottom: '10px', fontSize: '0.85em', fontStyle: 'italic'}}>
                                    Spreddit's smart contract runs on Stellar Futurenet, 
                                    and voters spend XLM to upvote/downvote/post.
                                </p>
                            </div>
                            <div style={{fontSize: '0.7em', fontStyle: 'italic'}}>
                               <div>
                                   {'Using RPC server  '}
                                   <a href="#" 
                                      onClick={(e) => {e.preventDefault(); setShowRPCPathOverlay(true); }}>
                                       change
                                   </a>
                               </div>
                               <div>
                                   {`${sorobanPath ? sorobanPath : DEFAULT_SOROBAN_PATH}`}
                               </div>
                               <div>
                               </div>
                            </div>

                        </div>
                    </Section>


                    <Section style={{textAlign: 'center'}}>
                        <input style={{width: '300px', marginBottom: '5px'}} 
                               type="text" placeholder="Futurenet wallet secret key" 
                               value={futurenetKey ? futurenetKey : ''} 
                               onChange={(e)=>setFuturenetKey(
                                       e.target.value.length > 0 ? e.target.value : null)}

                        />
                        <div style={{fontSize: '0.7em'}}>
                           <a href="https://laboratory.stellar.org/#account-creator?network=futurenet"
                              target="_blank"
                           >
                            Use Stellar Laboratory to create & fund keys 
                           </a>
                        </div>
                    </Section>
                    
                    <Section style={{textAlign: 'center'}}>
                        <button type="submit" className="button-lg" 
                            onClick={(e) => {e.preventDefault(); setShowPostOverlay(true); }}
                        >
                            Post new link
                        </button>
                    </Section>

                    {sorobanState != null && sorobanState.articles.length > 0 ? 
                    <Section style={{textAlign: 'center'}}>
                        {sorobanState.articles.map( link =>
                            <div key={link.uri} 
                                style={{marginBottom: '20px',
                                        border: '1px solid #cccccc', padding: '10px', textAlign: 'justify'}}>
                                {0 == 1 ? 
                                <div style={{marginBottom: '5px'}}>
                                    <ReactTinyLink
                                    cardSize="small" showGraphic={true}
                                    maxLine={2} minLine={1} url={link.uri}
                                    /> 
                                </div> : null}
                                <div style={{marginBottom: '10px'}}>
                                    <a href={link.uri} target='_blank'>{link.uri}</a>
                                </div>
                                <div style={{
                                    display: 'flex', flexDirection: 'row', 
                                    justifyContent: 'space-between', alignItems: 'center'        
                                }}>
                                    <div style={{marginRight: '40px', fontSize: '1.2em'}}>
                                        { ' ( ' } 
                                            <span style={{
                                                color: link.count > 0 ? 'green' : '#B93C3F'
                                            }}>
                                                {link.count}
                                            </span>
                                        { ' ) ' } 
                                    </div>
                                    <div>
                                        <FaRegThumbsUp style={{
                                            fontSize: '1.2em', marginRight: '20px', color:'green'}} /> 
                                        <FaRegThumbsDown style={{ 
                                            fontSize: '1.2em', marginRight: '20px', color:'#B93C3F'}} /> 
                                        <FaCommentDots style={{
                                            fontSize: '1.2em', color:'#333333'}} /> 
                                    </div>
                                </div>
                            </div>
                        )}
                    </Section> : null }

                </Panel>

              </div>
            </div>
          </div>
    );
}
//-----

export default App;
