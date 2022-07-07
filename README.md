# Goal
This project aim to build a core functionality for H5 games using ECS, so you can build reusable and easy to share systems on top of it.
If you building multiplayer game and using your engine solely for client rendering, this framework may fit into your gameplay code that share between client and server. 
> This is a personal project for learing purpose. It is incomplete, poorly tested and require more work to use for production.

# Guideline
The framework is published as an npm package, you can install from command line:

`npm install vux0303/ecs-with-replication`

The package contains two parts:
* [The ECS framework](https://github.com/vux0303/typescript-ECS-framework/wiki): a very basic ECS written in Typescipt with minial APIs
* [Replication System](https://github.com/vux0303/typescript-ECS-framework/wiki/Replication-System): a system resolve what to be sent between client and server, built on top of the framework

# Implementation references
* [ Implementing a type-safe ECS with typescript](https://dev.t-matix.com/blog/platform/eimplementing-a-type-saf-ecs-with-typescript/)
* [Overwatch gameplay architecture and netcode](http://overwatch%20gameplay%20architecture%20and%20netcode/)
* [Why vanilla ECS is not enough](https://ajmmertens.medium.com/why-vanilla-ecs-is-not-enough-d7ed4e3bebe5)
