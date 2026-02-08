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

    // ─── Additional coverage tests ───────────────────────────────────────

    function test_createSplit_lengthMismatch() public {
        address[] memory r = new address[](2);
        r[0] = bob; r[1] = carol;
        uint256[] memory s = new uint256[](1);
        s[0] = 10000;
        vm.expectRevert("length mismatch");
        agent.createSplit(keccak256("bad"), r, s, address(cusd));
    }

    function test_createSplit_empty() public {
        address[] memory r = new address[](0);
        uint256[] memory s = new uint256[](0);
        vm.expectRevert("empty");
        agent.createSplit(keccak256("empty"), r, s, address(cusd));
    }

    function test_createSplit_badShares() public {
        address[] memory r = new address[](1);
        r[0] = bob;
        uint256[] memory s = new uint256[](1);
        s[0] = 5000; // not 10000
        vm.expectRevert("shares must total 10000 bps");
        agent.createSplit(keccak256("bad-shares"), r, s, address(cusd));
    }

    function test_executeSplit_notActive() public {
        vm.expectRevert("split not active");
        agent.executeSplit(keccak256("nonexistent"), 100e18);
    }

    function test_schedulePayment_unlimitedExecs() public {
        vm.startPrank(alice);
        cusd.approve(address(agent), type(uint256).max);
        uint256 id = agent.schedulePayment(bob, address(cusd), 1e18, 1 hours, 0);
        vm.stopPrank();

        // Execute multiple times — unlimited
        for (uint256 i; i < 5; i++) {
            vm.warp(block.timestamp + 1 hours);
            agent.executeScheduled(id);
        }
        assertEq(cusd.balanceOf(bob), 1005e18);
    }

    function test_cancelScheduled_notOwner() public {
        vm.startPrank(alice);
        cusd.approve(address(agent), type(uint256).max);
        uint256 id = agent.schedulePayment(bob, address(cusd), 1e18, 1 hours, 0);
        vm.stopPrank();

        vm.prank(bob);
        vm.expectRevert("not owner");
        agent.cancelScheduled(id);
    }

    function test_addExpense_notActive() public {
        // Group 999 doesn't exist, so not active
        vm.expectRevert("group not active");
        agent.addExpense(999, 100e18, "test");
    }

    function test_addExpense_notMember() public {
        address[] memory members = new address[](1);
        members[0] = alice;
        uint256 groupId = agent.createGroup("solo", members, address(cusd));

        vm.prank(bob); // not a member
        vm.expectRevert("not a member");
        agent.addExpense(groupId, 100e18, "test");
    }

    function test_settleGroup_notActive() public {
        address[] memory f = new address[](0);
        address[] memory t = new address[](0);
        uint256[] memory a = new uint256[](0);
        vm.expectRevert("group not active");
        agent.settleGroup(999, f, t, a);
    }

    function test_settleGroup_lengthMismatch() public {
        address[] memory members = new address[](2);
        members[0] = alice; members[1] = bob;
        uint256 groupId = agent.createGroup("test", members, address(cusd));

        address[] memory f = new address[](1);
        f[0] = bob;
        address[] memory t = new address[](1);
        t[0] = alice;
        uint256[] memory a = new uint256[](2); // mismatch
        a[0] = 10e18; a[1] = 20e18;

        vm.expectRevert("length mismatch");
        agent.settleGroup(groupId, f, t, a);
    }

    function test_getSplit() public {
        address[] memory r = new address[](1);
        r[0] = bob;
        uint256[] memory s = new uint256[](1);
        s[0] = 10000;
        bytes32 sid = keccak256("view-test");
        agent.createSplit(sid, r, s, address(cusd));

        (address[] memory recipients, uint256[] memory shares, address token, bool active) = agent.getSplit(sid);
        assertEq(recipients[0], bob);
        assertEq(shares[0], 10000);
        assertEq(token, address(cusd));
        assertTrue(active);
    }

    function test_getGroupMembers() public {
        address[] memory members = new address[](2);
        members[0] = alice; members[1] = bob;
        uint256 groupId = agent.createGroup("grp", members, address(cusd));
        address[] memory m = agent.getGroupMembers(groupId);
        assertEq(m.length, 2);
        assertEq(m[0], alice);
    }

    function test_getExpense() public {
        address[] memory members = new address[](1);
        members[0] = alice;
        uint256 groupId = agent.createGroup("exp", members, address(cusd));

        vm.prank(alice);
        agent.addExpense(groupId, 50e18, "lunch");

        (address paidBy, uint256 amount, string memory desc, bool settled) = agent.getExpense(groupId, 0);
        assertEq(paidBy, alice);
        assertEq(amount, 50e18);
        assertEq(desc, "lunch");
        assertFalse(settled);
    }

    function test_getGroupExpenseCount() public {
        address[] memory members = new address[](1);
        members[0] = alice;
        uint256 groupId = agent.createGroup("cnt", members, address(cusd));

        vm.startPrank(alice);
        agent.addExpense(groupId, 10e18, "a");
        agent.addExpense(groupId, 20e18, "b");
        vm.stopPrank();

        assertEq(agent.getGroupExpenseCount(groupId), 2);
    }

    function test_isMember_false() public {
        address[] memory members = new address[](2);
        members[0] = alice; members[1] = bob;
        uint256 groupId = agent.createGroup("check", members, address(cusd));

        vm.prank(carol); // not a member
        vm.expectRevert("not a member");
        agent.addExpense(groupId, 10e18, "nope");
    }

    function test_getDuePayments_noneActive() public {
        vm.startPrank(alice);
        cusd.approve(address(agent), type(uint256).max);
        uint256 id = agent.schedulePayment(bob, address(cusd), 1e18, 1 hours, 0);
        agent.cancelScheduled(id);
        vm.stopPrank();

        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        vm.warp(block.timestamp + 2 hours);
        uint256[] memory due = agent.getDuePayments(ids);
        assertEq(due.length, 0);
    }

    function test_revokeAgent() public {
        vm.startPrank(alice);
        agent.authorizeAgent(address(0xBEEF), 100 ether);
        assertEq(agent.allowances(alice, address(0xBEEF)), 100 ether);
        assertTrue(agent.authorizedAgents(address(0xBEEF)));

        agent.revokeAgent(address(0xBEEF));
        assertEq(agent.allowances(alice, address(0xBEEF)), 0);
        vm.stopPrank();
    }

    function test_executeScheduled_notActive() public {
        vm.prank(alice);
        cusd.approve(address(agent), type(uint256).max);

        vm.prank(alice);
        uint256 id = agent.schedulePayment(bob, address(cusd), 10 ether, 1 hours, 1);

        vm.warp(block.timestamp + 2 hours);
        agent.executeScheduled(id);
        // Now it's inactive (maxExecs=1, execCount=1)
        vm.warp(block.timestamp + 2 hours);
        vm.expectRevert("not active");
        agent.executeScheduled(id);
    }

    function test_executeScheduled_notDueYet() public {
        vm.prank(alice);
        cusd.approve(address(agent), type(uint256).max);

        vm.prank(alice);
        uint256 id = agent.schedulePayment(bob, address(cusd), 10 ether, 1 hours, 5);

        vm.expectRevert("not due yet");
        agent.executeScheduled(id);
    }

    function test_executeScheduled_maxExecsReached() public {
        vm.prank(alice);
        cusd.approve(address(agent), type(uint256).max);

        vm.prank(alice);
        uint256 id = agent.schedulePayment(bob, address(cusd), 10 ether, 1 hours, 2);

        vm.warp(block.timestamp + 2 hours);
        agent.executeScheduled(id);
        vm.warp(block.timestamp + 2 hours);
        agent.executeScheduled(id);
        // maxExecs=2, execCount=2 => inactive
        vm.warp(block.timestamp + 2 hours);
        vm.expectRevert("not active");
        agent.executeScheduled(id);
    }

    function test_getDuePayments_mixedStates() public {
        vm.prank(alice);
        cusd.approve(address(agent), type(uint256).max);

        vm.startPrank(alice);
        uint256 id0 = agent.schedulePayment(bob, address(cusd), 10 ether, 1 hours, 5);
        uint256 id1 = agent.schedulePayment(bob, address(cusd), 10 ether, 2 hours, 5);
        uint256 id2 = agent.schedulePayment(bob, address(cusd), 10 ether, 3 hours, 5);
        vm.stopPrank();

        // Warp 1.5 hours — only id0 is due
        vm.warp(block.timestamp + 1.5 hours);
        uint256[] memory ids = new uint256[](3);
        ids[0] = id0;
        ids[1] = id1;
        ids[2] = id2;
        uint256[] memory due = agent.getDuePayments(ids);
        assertEq(due.length, 1);
        assertEq(due[0], id0);
    }

    function test_settleGroup_transfers() public {
        // Create group
        address[] memory members = new address[](2);
        members[0] = alice;
        members[1] = bob;

        vm.prank(alice);
        uint256 gid = agent.createGroup("dinner", members, address(cusd));

        // Add expense
        vm.prank(alice);
        agent.addExpense(gid, 100 ether, "dinner for two");

        // bob owes alice 50 ether
        vm.prank(bob);
        cusd.approve(address(agent), 50 ether);

        address[] memory froms = new address[](1);
        address[] memory tos = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        froms[0] = bob;
        tos[0] = alice;
        amounts[0] = 50 ether;

        uint256 u1Before = cusd.balanceOf(alice);
        agent.settleGroup(gid, froms, tos, amounts);
        assertEq(cusd.balanceOf(alice), u1Before + 50 ether);

        // Check expense is settled
        (,,, bool settled) = agent.getExpense(gid, 0);
        assertTrue(settled);
    }
}
