# Lackluster Movies Source Code

The structure of the source is as follows:

1. `core` consists of a core library that abstracts away database operations and can be utilized in the context of Lambda implementations, or anywhere such functionality is required.
1. `infra` consists of a CDK application representing the AWS infrastructure.
1. `tools` consists of a command line interface to interact with the system. 
