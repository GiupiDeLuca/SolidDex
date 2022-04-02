// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "./wallet.sol";
import "../node_modules/@openzeppelin/contracts/utils/Counters.sol";

contract Dex is Wallet {

    using SafeMath for uint;
    using Counters for Counters.Counter;

    Counters.Counter private _orderIds;

    enum Side {
        BUY,
        SELL
    }

    struct Order {
        uint id;
        address trader;
        Side side;
        bytes32 ticker;
        uint amount;
        uint price;
        uint filled;
    }

    mapping(bytes32 => mapping(uint => Order[])) public orderBook;

    function getOrders(bytes32 ticker, Side side) public view returns(Order[] memory) {
        return orderBook[ticker][uint(side)];
    }

    function createLimitOrder(Side _side, bytes32 _ticker, uint _amount, uint _price) public {

        if (_side == Side.BUY) {
            require(balances[msg.sender]["ETH"] >= _amount.mul(_price));
        } else if (_side == Side.SELL) {
            require(balances[msg.sender][_ticker] >= _amount);
        }

        Order[] storage orders = orderBook[_ticker][uint(_side)];

        uint orderId = _orderIds.current();

        orders.push(
            Order(orderId, msg.sender, _side, _ticker, _amount, _price, 0)
        );

        uint i = orders.length > 0 ? orders.length - 1 : 0;

        while (i > 0) {
            if (_side == Side.BUY) {
                if (orders[i].price < orders[i-1].price) {
                    break;
                } else {
                    Order memory tempOrder = orders[i-1];
                    orders[i-1] = orders[i];
                    orders[i] = tempOrder;
                    i --;
                }
            } else if (_side == Side.SELL) {
                if (orders[i].price > orders[i-1].price) {
                    break;
                } else {
                    Order memory tempOrder = orders[i-1];
                    orders[i-1] = orders[i];
                    orders[i] = tempOrder;
                    i --;
                }
            }
        }
        
        _orderIds.increment();

    }

    function createMarketOrder (Side _side, bytes32 _ticker, uint _amount) public {

        if (_side == Side.SELL) {
            require (balances[msg.sender][_ticker] >= _amount, "Insufficient balance");
        }

        Order[] storage orders = orderBook[_ticker][uint(_side == Side.BUY ? 1 : 0)];

        uint totalFilled; 

        for (uint i = 0; i < orders.length && totalFilled < _amount; i ++) {

            // how much can we fill from orders[i]
            //Update totalFilled

            //Execute the trade and shift balances between buyer and seller
            //Verify the buyer has enough ETH to cover the purchase
        }

        // loop through the orders array and remove the 100 % filled orders

    }

}