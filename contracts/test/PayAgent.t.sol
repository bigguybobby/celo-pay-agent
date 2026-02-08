// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PayAgent.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

contract MockERC20 is IERC20 {
    string public name = "Mock cUSD";
    string public symbol = "cUSD";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract PayAgentTest is Test {
    PayAgent agent;
    MockERC20 cusd;
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address carol = makeAddr("carol");
    address aiAgent = makeAddr("aiAgent");

    function setUp() public {
        agent = new PayAgent();
        cusd = new MockERC20();
        cusd.mint(alice, 1000e18);
        cusd.mint(bob, 1000e18);
        cusd.mint(carol, 1000e18);
    }

    function test_createAndExecuteSplit() public {
        address[] memory recipients = new address[](2);
        recipients[0] = bob;
        recipients[1] = carol;
        uint256[] memory shares = new uint256[](2);
        shares[0] = 6000; // 60%
        shares[1] = 4000; // 40%

        bytes32 splitId = keccak256("team-split");
        agent.createSplit(splitId, recipients, shares, address(cusd));

        vm.startPrank(alice);
        cusd.approve(address(agent), 100e18);
        agent.executeSplit(splitId, 100e18);
        vm.stopPrank();

        assertEq(cusd.balanceOf(bob), 1060e18);
        assertEq(cusd.balanceOf(carol), 1040e18);
    }

    function test_scheduleAndExecutePayment() public {
        vm.startPrank(alice);
        cusd.approve(address(agent), type(uint256).max);
        uint256 id = agent.schedulePayment(bob, address(cusd), 10e18, 1 days, 3);
        vm.stopPrank();

        // Not due yet
        vm.expectRevert("not due yet");
        agent.executeScheduled(id);

        // Warp 1 day
        vm.warp(block.timestamp + 1 days);
        agent.executeScheduled(id);
        assertEq(cusd.balanceOf(bob), 1010e18);

        // Execute again after another day
        vm.warp(block.timestamp + 1 days);
        agent.executeScheduled(id);
        assertEq(cusd.balanceOf(bob), 1020e18);

        // Third execution
        vm.warp(block.timestamp + 1 days);
        agent.executeScheduled(id);
        assertEq(cusd.balanceOf(bob), 1030e18);

        // Fourth should fail — max 3
        vm.warp(block.timestamp + 1 days);
        vm.expectRevert("not active");
        agent.executeScheduled(id);
    }

    function test_groupExpenses() public {
        address[] memory members = new address[](3);
        members[0] = alice;
        members[1] = bob;
        members[2] = carol;

        uint256 groupId = agent.createGroup("roommates", members, address(cusd));

        // Alice pays 90 cUSD for dinner
        vm.prank(alice);
        agent.addExpense(groupId, 90e18, "dinner");

        // Settle: bob and carol each owe alice 30 cUSD
        vm.prank(bob);
        cusd.approve(address(agent), 30e18);
        vm.prank(carol);
        cusd.approve(address(agent), 30e18);

        address[] memory froms = new address[](2);
        froms[0] = bob;
        froms[1] = carol;
        address[] memory tos = new address[](2);
        tos[0] = alice;
        tos[1] = alice;
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 30e18;
        amounts[1] = 30e18;

        agent.settleGroup(groupId, froms, tos, amounts);

        assertEq(cusd.balanceOf(alice), 1060e18); // got 60 back
        assertEq(cusd.balanceOf(bob), 970e18);
        assertEq(cusd.balanceOf(carol), 970e18);
    }

    function test_authorizeAgent() public {
        vm.prank(alice);
        agent.authorizeAgent(aiAgent, 50e18);
        assertEq(agent.allowances(alice, aiAgent), 50e18);
        assertTrue(agent.authorizedAgents(aiAgent));

        vm.prank(alice);
        agent.revokeAgent(aiAgent);
        assertEq(agent.allowances(alice, aiAgent), 0);
    }

    function test_cancelScheduled() public {
        vm.startPrank(alice);
        cusd.approve(address(agent), type(uint256).max);
        uint256 id = agent.schedulePayment(bob, address(cusd), 10e18, 1 days, 0);
        agent.cancelScheduled(id);
        vm.stopPrank();

        vm.warp(block.timestamp + 1 days);
        vm.expectRevert("not active");
        agent.executeScheduled(id);
    }

    function test_getDuePayments() public {
        vm.startPrank(alice);
        cusd.approve(address(agent), type(uint256).max);
        uint256 id0 = agent.schedulePayment(bob, address(cusd), 1e18, 1 hours, 0);
        uint256 id1 = agent.schedulePayment(carol, address(cusd), 2e18, 2 hours, 0);
        vm.stopPrank();

        // After 1 hour, only id0 is due
        vm.warp(block.timestamp + 1 hours);
        uint256[] memory ids = new uint256[](2);
        ids[0] = id0;
        ids[1] = id1;
        uint256[] memory due = agent.getDuePayments(ids);
        assertEq(due.length, 1);
        assertEq(due[0], id0);

        // After 2 hours, both due
        vm.warp(block.timestamp + 1 hours);
        due = agent.getDuePayments(ids);
        assertEq(due.length, 2);
    }
}
