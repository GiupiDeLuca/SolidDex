// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

contract Wallet is Ownable {
    using SafeMath for uint256;

    struct Token {
        bytes32 ticker;
        address tokenAddress;
    }

    mapping(address => mapping(bytes32 => uint256)) public balances;

    mapping(bytes32 => Token) public tokenMapping;

    bytes32[] public tickers;

    modifier tokenExists(bytes32 ticker) {
        require(
            tokenMapping[ticker].tokenAddress != address(0),
            "token does not exist"
        );
        _;
    }

    function addToken(bytes32 ticker, address tokenAddr) external onlyOwner {
        require(
            tokenMapping[ticker].tokenAddress == address(0),
            "token already exists"
        );
        tokenMapping[ticker].tokenAddress = tokenAddr;
        tickers.push(ticker);
    }

    function deposit(uint256 amount, bytes32 ticker)
        external
        tokenExists(ticker)
    {
        IERC20 tokenInstance = IERC20(tokenMapping[ticker].tokenAddress);
        tokenInstance.transferFrom(msg.sender, address(this), amount);
        balances[msg.sender][ticker] = balances[msg.sender][ticker].add(amount);
    }

    function depositEth() external payable {
        balances[msg.sender][bytes32("ETH")] = balances[msg.sender][
            bytes32("ETH")
        ].add(msg.value);
    }

    function withdraw(uint256 amount, bytes32 ticker)
        external
        tokenExists(ticker)
    {
        require(balances[msg.sender][ticker] >= amount, "insufficient funds");
        balances[msg.sender][ticker] = balances[msg.sender][ticker].sub(amount);
        IERC20(tokenMapping[ticker].tokenAddress).transfer(msg.sender, amount);
    }
}
