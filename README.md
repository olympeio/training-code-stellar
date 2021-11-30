Demonstration project to query account balance and issue payments on [Stellar](https://www.stellar.org/) test network.

# Usage
Pull this project. From its root, start up a local data cloud:
```
docker compose up
```

Load this project on the data cloud:
```
npm run reset
```

Serve DRAW
```
npm run serve
```

> You may also [work on a remote data cloud instance](#working-on-a-remote-data-cloud-instance).

## Serve a backend service
```
npm run build:node
cd dist-node/
node main.js sc.app=017d58914a3432920c3f
```

## Working on a remote data cloud instance
Complete the unfilled fields `<...>` in file [oConfig-dist.json](res/oConfig-dist.json).
Then, add `:dist` to `npm run ...` commands, e.g. `npm run serve:dist`.

When working on a remote data cloud instance, you do not need to (and cannot) load anything on the data cloud.

# Tutorial
We will create a brick to connect to Stellar test network and issue a payment between to accounts. This brick will be served in a node back-end. A small test app is already available to test your brick.

Step by step, in this tutorial, we will:
- create a coded action in DRAW
- implement this action with CODE
- use this action in a Remote Action (in DRAW)
- start a node service
- test

## Create the action signature in DRAW
Create a coded action `Issue Payment` with three inputs `from account secret`, `to account id`, and `amount`. `from account secret` will be the _secret_ key of the account that we will from which we will debit money. `to account id` will be the _public_ key of the account to which we will credit money.

Generate the brick template and put it in `src/node`.

## Implement your brick with CODE

We will use the following imports from Stellar packages:
```js
import { Keypair, Account, Networks, Operation, Asset } from "stellar-base";
import { BASE_FEE, TransactionBuilder, Server } from "stellar-sdk";
```

We need to get a [server](https://stellar.github.io/js-stellar-sdk/Server.html) to connect to and the [public/secret keypair(https://stellar.github.io/js-stellar-sdk/Keypair.html)] of account we want to debit:
```js
const server = new Server('https://horizon-testnet.stellar.org');
const sourceKeys = Keypair.fromSecret(fromAccountSecret);
```

Then, we need to load the debit account from the server:

```js
server.loadAccount(sourceKeys.publicKey()).then(...);
```
[loadAccount](https://stellar.github.io/js-stellar-sdk/Server.html#loadAccount) returns a promise. We get the loaded account in the promise callback. _NB_ `onUpdate` cannot be declared async.

Create a transaction:
```js
const transaction = new TransactionBuilder(account, {networkPassphrase: Networks.TESTNET, fee: BASE_FEE})
    .addOperation(Operation.payment({destination: toAccountId, amount: amount.toFixed(7), asset: Asset.native()}))
    .setTimeout(60)
    .build();
transaction.sign(sourceKeys);
```

Submit the transaction to server and handle success/errors:
```js
server.submitTransaction(transaction).then(...).catch(...);
```

Do not forget to `forwardEvent` when transaction succeeds.

Here is a working example:
```js
import { ActionBrick, registerBrick } from 'olympe';
import { Keypair, Account, Networks, Operation, Asset } from "stellar-base";
import { BASE_FEE, TransactionBuilder, Server } from "stellar-sdk";


export default class IssuePayment extends ActionBrick {

    /**
     * Executed every time the brick receives a new trigger event.
     * Note that the method will be executed _even if_ an input (fromAccount, accountSequence, toAccount, amount) is undefined.
     * 
     * @protected
     * @param {!Context} context
     * @param {string} fromAccount
     * @param {string} toAccount
     * @param {number} amount
     * @param {function()} forwardEvent
     */
    onUpdate(context, [fromAccountSecret, toAccountId, amount], [forwardEvent]) {

        console.log('Starting new transaction ...')

        // Configure Server to submit transactions
        const server = new Server('https://horizon-testnet.stellar.org');

        const sourceKeys = Keypair.fromSecret(fromAccountSecret);

        // Get up-to-date account info from server
        server.loadAccount(sourceKeys.publicKey()).then((account) => {

            // Create transaction
            const transaction = new TransactionBuilder(account, {networkPassphrase: Networks.TESTNET, fee: BASE_FEE})
                .addOperation(Operation.payment({destination: toAccountId, amount: amount.toFixed(7), asset: Asset.native()}))
                .setTimeout(60)
                .build();
            transaction.sign(sourceKeys);

            // Issue transaction
            server.submitTransaction(transaction).then((result) => {
                console.log('Transaction terminated successfully:', result.hash);
                forwardEvent();
            }).catch((error) => {
                console.log(`Failed to execute transaction: ${error.message}`);
            });
        });
    }
}

registerBrick('017d57f48c9dff05a8a9', IssuePayment);

```

## Use the action in a remote action
The test app comes with a service called `Stellar Services`. In DRAW, open this service and edit the remote action `Issue Payment`. Drop your new brick in there and plug it accordingly.

## Start a node service

At the root of your project, open a terminal and build an executable node script:
```bash
npm run build:node
```
(or `npm run build:node:dist` if you want to connect to a remote data cloud).

Then, move to directory `node-dist` and start the backend with:
```bash
node main.js sc.app=017d58914a3432920c3f
```

`017d58914a3432920c3f` is the tag of the service app you want to start in the node back-end (YMMV).

If the backend starts correctly, you should see the following logs:
```bash
[11:46:42.550] [INFO] SC: Starting application 017d58914a3432920c3f
```

## Test
Run UI application `Test App`. Click on `New Transaction`, fill the fields, and click `Submit`. Depending on how you implemented your brick, you should see some logs in the back-end service terminal. If the transaction terminates successfully, and if you correctly called `forwardEvent()` in this situation, you should be brought back to the account balances page.
