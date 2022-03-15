// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";


contract Wallet is Ownable {

    using SafeMath for uint;

    struct Token {
        bytes32 ticker;
        address tokenAddress;
    }

    mapping (address => mapping (bytes32 => uint)) public balances;

    mapping (bytes32 => Token) public tokenMapping;

    bytes32[] public tickers;

    modifier tokenExists(bytes32 ticker){
        require (tokenMapping[ticker].tokenAddress != address(0), "token does not exist");
        _;
    }

    function addToken(bytes32 ticker, address tokenAddr) onlyOwner external {
        require (tokenMapping[ticker].tokenAddress == address(0), "token already exists");
        tokenMapping[ticker].tokenAddress = tokenAddr;
        tickers.push(ticker);
    }

    function deposit(uint amount, bytes32 ticker) tokenExists(ticker) external {
        IERC20 tokenInstance = IERC20(tokenMapping[ticker].tokenAddress);
        tokenInstance.transferFrom(msg.sender, address(this), amount);
        balances[msg.sender][ticker] =  balances[msg.sender][ticker].add(amount);
    }

    function withdraw(uint amount, bytes32 ticker) tokenExists(ticker) external {
        require (balances[msg.sender][ticker] >= amount, "insufficient funds");
        balances[msg.sender][ticker] = balances[msg.sender][ticker].sub(amount);
        IERC20(tokenMapping[ticker].tokenAddress).transfer(msg.sender, amount);
    }


}