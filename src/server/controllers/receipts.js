const cloudinary = require('cloudinary').v2;

const fetch = require('node-fetch');
//const fs = require('fs');
const FormData = require('form-data');
const requestPackage = require('request');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

cloudinary.config({
  cloud_name: 'difceofnn',
  api_key: '138163593634117',
  api_secret: 'UQBGNsgKzLZDlijgj-t1Tx6Sm84'
});

//let token = "";

const tabUrl = 'https://api.tabscanner.com/AcMHx0XLLafK4avM8WdBLhZixu2fRP8WeY0z4rv1RCFPjNALkAnYIuQnJtH2BOqs';



module.exports = (db) => {


    let giveMeReceipt = ( req, res ) =>{

        //can use http path or ajax put in body
        // edit argument as necessary
        // console.log('hello give receipt', req.params.id);
        let input = req.params.id;

        db.receipts.getReceipt( input, (err, receipts) =>{
            if(err){
                console.error('error getting receipt(s)', err);
                res.status(500).send("Error getting receipt");
            } else {
                // console.log( 'AT CONTROLLER RESULTS', receipts );
                if(receipts.receipt.length === 0){
                    res.send('No entry');
                }else{
                    res.send( receipts.receipt );
                }
            }
        })
    };

    // upload photo to cloudinary > send to tabscanner > get token > send to get data
    let uploadPhoto = (request, response) => {
        console.log("Uploading up to cloudinary")
        let file = request.file.path;

        let url = "";
        let publicId = "";

        // uploading to cloudinary
        cloudinary.uploader.upload(
          file,
          function(error, result) {
            console.log("upload to cloudinary successful")
            url = result.url;
            publicId = result.public_id

            if (url !== "" && publicId !== "") {
                console.log(url)
                console.log(publicId)
                console.log("entering to fetch and post")

                // send photo to tab scanner
                const form = new FormData();
                form.append(publicId, requestPackage(url));

                fetch(`${tabUrl}/process`, {
                    method: 'post',
                    body:    form,
                    headers: form.getHeaders(),
                })
                .then(res => res.json())
                .then(json => {
                    console.log(json)
                    if (json.status === "failed") {
                        response.send(json.message)

                    } else if (json.status === "success") {
                        //return json.token;
                        let token = json.token;
                        let counter = 0;

                        while (true) {
                            var req = new XMLHttpRequest();
                            req.open("GET", `${tabUrl}/result/${token}`, false);
                            req.send();


                            const data = JSON.parse(req.responseText);
                            const dataResult = data.result
                            counter++;

                            // successful
                            if (data.code === 202) {

                                let receiptData = {
                                    user_id: 1,
                                    group_id: 1,
                                    img_token: token,
                                    subtotal: parseFloat(dataResult.subTotal)
                                }
                                db.receipts.createReceipt(receiptData, (err, createRecResults) => {
                                    if (err) {
                                        console.error(err);
                                        response.status(500).send("Query ERROR for adding receipt details.")

                                    } else {
                                        // means its successful > get receipt id that was uploaded to put inside the items table
                                        db.receipts.getReceipt(token, (err, getReceiptResults) => {
                                            //console.log(testToken)
                                            if (err) {
                                                console.error(err);
                                                response.status(500).send("Query ERROR for getting receipt info.")

                                            } else {
                                                console.log("get receipt is successful")

                                                let lineItems = dataResult.lineItems;
                                                let noOfLineItems = lineItems.length;
                                                let lineItemsCounter = 0;

                                                for (i=0; i<noOfLineItems; i++) {
                                                    console.log("entered for loop")

                                                    let receiptId = getReceiptResults.receipt[0].id;

                                                    // items
                                                    let itemData = {
                                                        receipt_id: receiptId,
                                                        item_name: lineItems[i].descClean,
                                                        price: parseFloat(lineItems[i].lineTotal),
                                                        quantity: lineItems[i].qty,
                                                        users_id: null
                                                    }
                                                    // now add items into table
                                                    db.items.createItems(itemData, (err, createItemResults) => {
                                                        if (err) {
                                                            console.error(err);
                                                            response.status(500).send("Query ERROR for creating items.")
                                                        } else {
                                                            // yey all successful
                                                            lineItemsCounter++
                                                            if (lineItemsCounter === lineItems.length) {
                                                                console.log(lineItemsCounter);
                                                                response.send("Databases are updated");
                                                            } else {
                                                                console.log("not yet")
                                                            }
                                                        }
                                                    })  //end of db createItems
                                                }  // end of for loop
                                            }  //end of checking for getReceipt query
                                        })  //end of db getReceipt
                                    }  //end of checking for createReceipt query
                                })  //end of db createReceipt
                                console.log(counter)
                                //response.send("DONE");
                                break;

                            } else if (counter === 10) {
                                response.send(`Connection lost. This is your token: ${token}! Please search for it later.`);
                            }
                        }  // end of while loop
                    }  // end of if statement for status
                })
                .catch(error => console.error(error));

            // if uploading on cloudinary fails
            } else {
                response.send("Failed to upload, try again")
            }
          }
        );  // end of cloudinary upload
    }  // end of upload photo

    let summaryReceipt = (req, res) => {
        console.log("HELLO in controller");
        var dataIn = req.params.id;

        db.receipts.getAllItems( dataIn, (err, receipts) =>{
            if(err){
                console.log('in here?');
                console.error('error getting receipt(s)', err);
                res.status(500).send("Error getting receipt");
            } else {
                console.log('am i here????');
                console.log( 'AT CONTROLLER RESULTS', receipts );
                if(receipts.rows.length === 0){
                    res.send('No entry');
                }else{
                    res.send( receipts.rows );
                }
            }
        })
    }

    let usersSummaryReceipt = (req, res) => {
        console.log("HELLO in controller");
        var dataIn = req.params.id;

        db.receipts.getIndvUserItems( dataIn, (err, receipts) =>{
            if(err){
                console.log('in here?');
                console.error('error getting receipt(s)', err);
                res.status(500).send("Error getting receipt");
            } else {
                console.log('am i here????');
                console.log( 'AT CONTROLLER RESULTS', receipts );
                if(receipts.rows.length === 0){
                    res.send('No entry');
                }else{
                    res.send( receipts.rows );
                }
            }
        })
    }

    let testItemName = (request, response) => {
        let receipt_id = 49;
        db.items.getItems(receipt_id, (err, results) => {
            if (err) {
                console.error(err);
                response.status(500).send("Query ERROR for getting items.");

            } else {
                let allItems = results.allItems;
                let itemName = allItems.map(obj => {
                    let objItemName = obj.item_name
                    let itemName = (objItemName.replace(/[^a-zA-Z ]/g, ""));
                    console.log(itemName);
                })
                response.send(results.allItems);
            }
        })
    }

    let getUserReceipts = (request, response) =>{
        const userId = parseInt(request.cookies.userId);
        console.log(userId)

        // get
        db.receipts.getUserReceipts(userId, (err, results) => {
            if (err) {
                console.error(err);
                response.status(500).send("Query ERROR for getting user's receipts.");
            } else {
                response.send(results.rows)
            }
        })
    }

    let updateReceipt = ( req, res)=>{ // update receipt and items;
        console.log('helo in update receipt controller');

        let dataIn = req.body.obj;
        console.log(dataIn);
        // db.receipts.updateReceipt(dataIn, (err,data)=>{
        //     if(err){
        //         console.error('error updating items entry', err);
        //         res.status(500).send("Error getting group stuff");
        //     } else {
        //         console.log('back in Receipt CONTROLLER');
        //         res.send(data);
        //     }
        // })
    }

  return {
    giveMeReceipt,
    uploadPhoto,
    summaryReceipt,
    usersSummaryReceipt,
    getUserReceipts,
    updateReceipt,
    testItemName,
  };
};