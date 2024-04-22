# BlueBand Vector-DB

Welcome to BlueBand Vector-DB, a vectra-on-filecoin database for indexing and managing vector datasets easily.

## IPC Subnet

Catalog metadata are stored on solidity contract deployed on subnets, facilitating retrieval of IPNS Ids, CIDs and indexed URIs interchangely. Here are the details:

- Subnet ID: [Insert Subnet ID]
- Contract Address: [Insert Contract Address]

## Lighthouse.Storage Integration

Through integration with Lighthouse.Storage and IPNS, BlueBand leverages IPNS IDs as the index IDs and pointers to the stored datasets. Even with changes in Content ID (CID) due to document upserts or removals, the IPNS pointer remains constant.

## Local Testing

To locally test BlueBand Vector-DB, follow these steps:

1. Prepare Repository:

   ```bash
   git clone https://github.com/highfeast/blueband
   cd vector-db && npm install && npm link
   ```

2. Navigate to the `node-test` directory:

   ```bash
   cd node-test
   npm install && npm link blueband
   ```

3. Configure Environment Variables:

   - OpenAI Key: Add your [OpenAI]() and [Lighthouse]() API key to the `.env` file.
   - Ensure that IPC Subnet is running locally. See [Instructuctions]()

4. Run Tests:
   ```bash
   npm run test
   ```

## BlueBand-Client: Health Information Case Study

BlueBand-Client is a specialized application built on top of BlueBand, tailored for managing health information efficiently. Here's a brief overview:

**Description:** BlueBand-Client streamlines the process of organizing and accessing health information. It leverages the power of BlueBand's vector database to provide quick and accurate indexing of health-related data.

[Demo]()

**Contributors:**

- **Adaeze Ani:** Public Health MSc student and Product Manager.
- **Blossom:** Design expert specializing in user interface and experience.
- **Godson:** Developer with expertise in building scalable and reliable applications.


References
- [video]()
- [Blueband Smart-contract]()
- [IPC]()
- [Lighthouse.storage]()
- [Vectra local database]()
