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
            Order(orderId, msg.sender, _side, _ticker, _amount, _price)
        );

        // if (_side == Side.BUY) {

        // } else if (_side == Side.SELL) {

        // }

        _orderIds.increment();

    }

}