import React from 'react';
// import {Username} from './usernameSummary';
import Cookies from 'js-cookie';

import styles from './style.scss';

class IndividualSummary extends React.Component {
    constructor() {
        super();
        this.state = {
            items: null,
            users: null,
            // userDetails :null,
            receipt:null,
            saveAmount: null,
            total:0,
        }
    }

    componentDidMount(){

        // this.getAllItems();
        // // this.getAllUsers();
        // // this.getUsersHandler();
        // this.getReceipt();
        // this.getUsersHandlersss();
        console.log('MOUNTING', this.props)
        this.setState({
            items: this.props.items,
            users: this.props.users,
            receipt: this.props.receipt,
                })


        setTimeout(() =>{this.calcAmount()}, 1000);
    }
    // Cookies.get('receiptId')
    getReceipt=()=>{
        let receiptId = 1;
        fetch(`/receipt/${receiptId}`)
          .then(response=>response.json())
          .then(response=>this.setState({receipt: response}))
    }

    getAllItems=()=>{
      let receiptId = 1;
      fetch(`/items/${receiptId}`)
        .then(response=>response.json())
        .then(response=>this.setState({items: response}))
    }

    // getAllUsers=()=>{
    //   let receiptId = 1;
    //   fetch(`/groupSummary/${receiptId}`)
    //     .then(response=>response.json())
    //     .then(response=>this.setState({users: response}))
    // }

    // getUsersHandler(){
    //   fetch(`/search/group`)
    //     .then(response=>response.json())
    //     .then(response=>this.setState({userDetails: response.users}))
    // }

    getUsersHandlersss=()=>{
      let receiptId = 1
      fetch(`/group/${receiptId}`)
        .then(response=>response.json())
        .then(response=>this.setState({users: response}))
    }
    calcAmount=()=>{
        console.log(this.state.users);
        let usersGroupsArr = this.state.users;
        let itemsList = this.state.items;
        let otherChargesTotal =  this.state.receipt.total - this.state.receipt.subtotal;
        let otherChargesSplit = otherChargesTotal/usersGroupsArr.length;
        let objToSave = [];
        let newTotal = 0;
        const reducer = (accumulator, currentValue) => accumulator + currentValue;

        usersGroupsArr.forEach(user=>{
            let itemArr=[];
            let totalPrice = [];
            itemsList.forEach(item=>{
                for(let i = 0; i < item.users_id.length; i++){
                    if(item.users_id[i] === user.id){
                        // console.log(`${item.item_name} belongs to ${user.friend_id}`);
                        let obj = {
                                item_name: item.item_name,
                                price: item.price,
                                users_id :item.users_id,
                        }
                    itemArr.push(obj);
                    }
                }
            })

            itemArr.forEach(item=>{
                // console.log(item.users_id.length);
                let price = item.price/item.users_id.length;

                totalPrice.push(price);

            })

            let splitPrice = totalPrice.reduce(reducer);// sums up totalPrice array

                let gst_serviceCharge = 0;
                // if subtotal is not equal total, means tehre is service charge and gst, else gst_serviccahrge = 0;
                if(this.state.receipt.total !== this.state.receipt.subtotal){

                   let serviceCharge = splitPrice * 0.1;
                   let gst = (splitPrice + serviceCharge) * 0.07;
                   gst_serviceCharge = gst + serviceCharge;

                }

                splitPrice = splitPrice + gst_serviceCharge;;

            console.log("RECEIPT!",this.state.receipt);

            let plsSave = {
                userId: user.id,
                // Math.round((priceToSave + 0.00001) * 100) / 100
                amount: Math.round((splitPrice + 0.001) * 100) / 100,
                receiptId : this.state.receipt.id,
            }

            objToSave.push(plsSave);
            newTotal = plsSave.amount + newTotal;
        })

        console.log(objToSave);

        this.setState({saveAmount:objToSave});


        console.log('NEW TOTAL', newTotal);
        let updateTotal = this.state.receipt.total;
        this.setState({[updateTotal]:newTotal});
        console.log('ALL STATE',this.state);
        // this.props.done(this.state.saveAmount);
    }

    render() {

        if (this.state.items === null || this.state.users === null  ||this.state.receipt === null) {
            return <p>LOADING</p>
        } else {
            let priceSummaryForAll = [];
            const reducer = (accumulator, currentValue) => accumulator + currentValue;
            let userSummary = this.state.users.map((user,indexUser)=>{
                let userForCurrent = user.username;
                let otherChargesTotal = this.state.receipt.total - this.state.receipt.subtotal;
                let peopleInGroup = this.state.users.length;  // this is bad
                let otherChargesSplit = (otherChargesTotal/peopleInGroup); // this is bad too

                let itemArr=[]; //items belonging to user[index]
                let totalPrice = []; //all prices of itemArr

                let putItemsInArr = this.state.items.map((item)=>{
                    for(let i = 0; i < item.users_id.length; i++){
                        if(item.users_id[i] === user.id){
                            // console.log(`${item.item_name} belongs to ${user.friend_id}`);
                            let obj = {
                                    item_name: item.item_name,
                                    price: item.price,
                                    users_id :item.users_id,
                            }
                            itemArr.push(obj);
                        }
                    }
                });

                let itemList = itemArr.map((item,index)=>{
                    // console.log(item.users_id.length);
                    let price = item.price/item.users_id.length;

                    totalPrice.push(price);
                    price = price.toFixed(2);
                    return(
                        <h3 className={styles.indvSumItemName} key={index}>{item.item_name}   ${price}</h3>
                    );
                })

                let splitPrice = totalPrice.reduce(reducer);// sums up totalPrice array

                let gst_serviceCharge = 0;
                // if subtotal is not equal total, means tehre is service charge and gst, else gst_serviccahrge = 0;
                if(this.state.receipt.total !== this.state.receipt.subtotal){

                   let serviceCharge = splitPrice * 0.1;
                   let gst = (splitPrice + serviceCharge) * 0.07;
                   gst_serviceCharge = gst + serviceCharge;

                }

                splitPrice = splitPrice + gst_serviceCharge;

                priceSummaryForAll.push(splitPrice);

                splitPrice = splitPrice.toFixed(2);

                return(
                    <div key={indexUser}>
                        <h2 className={styles.userNameSum}>{userForCurrent}</h2>
                           <div>
                               {itemList}
                           </div>
                           <h3 className={styles.indvSumOwed}>(Service & GST: ${gst_serviceCharge.toFixed(2)})</h3>
                        <h3 className={styles.indvSumOwed}>${splitPrice}</h3>
                        <div className={styles.lineManager}></div>
                    </div>
                );
            });

            let calculatedTotal = priceSummaryForAll.reduce(reducer)

            return(
                <React.Fragment>
                    <div className={styles.headerSummary}>
                        <h1 className={styles.textCenterSummary}>Individual Payment Summary</h1><br/>
                    </div>
                    <div style={{marginTop: 80 + "px"}}>
                        <div>
                            {userSummary}
                            <h1>Calculated Total: $ {calculatedTotal.toFixed(3)}</h1>
                        </div>
                    </div>
                    <button className={styles.indvSumButton} onClick={()=>{this.props.done()}}>Back to Home</button>
                </React.Fragment>
            );
        }
    }
}

export default IndividualSummary;

// <a href='/'>
// </a>