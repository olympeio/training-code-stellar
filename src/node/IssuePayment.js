import { ActionBrick, registerBrick } from 'olympe';
import { Keypair, Account, Networks, Operation, Asset } from "stellar-base";
import { BASE_FEE, TransactionBuilder, Server } from "stellar-sdk";


export default class IssuePayment extends ActionBrick {

    /**
     * Executed every time the brick receives a new trigger event.
     * Note that the method will be executed _even if_ an input (fromAccount, accountSequence, toAccount, amount) is undefined.
     * 
     * @protected
     * @param {!BrickContext} context
     * @param {string} fromAccount
     * @param {string} toAccount
     * @param {number} amount
     * @param {function()} forwardEvent
     */
    update(context, [fromAccountSecret, toAccountId, amount], [forwardEvent]) {

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
