# BlueBand Vector-DB

Welcome to BlueBand Vector-DB, a `vectra-on-filecoin` database for indexing and managing pinned datasets easily.

👉 [Full Video](https://vimeo.com/manage/videos/937456306)

## IPC Subnet

Catalog metadatas are stored on smart contracts deployed on a local subnet, facilitating retrieval of IPNS Ids, CIDs and indexed URIs interchangeably.

|                   |                                                       |
| ----------------- | ----------------------------------------------------- |
| Subnet ID         | /r314159/t410fzwlpahfajqd663bnjiaduc5xjxcjgblkgvd6izy |
| Blueband Contract | 0xeD3fda27A039FFCd66AcA14b82b86e17aFBc2Da2            |

## Lighthouse.Storage Integration

Through integration with Lighthouse.Storage and IPNS, BlueBand leverages IPNS IDs as the index IDs and pointers to the stored datasets. Even with changes in Content ID (CID) due to document upserts or removals, the IPNS pointer remains constant.

## Subnet  Set-up and Deployment

1. [IPC Installation and Subnet Deployment](https://docs.ipc.space/quickstarts/deploy-a-subnet)

2. Connect [metamask](https://metamask.io/) to your IPC subnet, copy the blueband [contract](https://github.com/highfeast/blueband/blob/main/smart-contract/contracts/Blueband.sol) and deploy from [remix](https://remix.ethereum.org/)

3. Replace new contract address in `.env`

## Local Testing

To test BlueBand Vector-DB on local subnet, follow these steps:

1. Prepare Repository:

   ```bash
   git clone https://github.com/highfeast/blueband
   cd vector-db && npm install && npm link
   ```

2. Navigate to the `node-test` directory:

   ```bash
   cd node-test
   npm install && npm link vector-db
   ```

3. Configure Environment Variables:

   - Ensure IPC Subnet is running on docker. See [Instructuctions](https://docs.ipc.space/quickstarts/deploy-a-subnet)
   - Add your `IPC chainId`, [OpenAI api Key](https://platform.openai.com/usage) and [Lighthouse api Key](https://files.lighthouse.storage/dashboard/apikey) value to the `.env` file in node-test.

4. Run Tests:
   ```bash
   npm run test
   ```

## BlueBand-Client: Health Information Case Study

BlueBand-Client is a specialized application built on top of BlueBand, tailored for managing health information efficiently. Here's a brief overview:

**Description:** BlueBand-Client streamlines the process of organizing and accessing health information. It leverages the power of BlueBand's vector database to provide quick and accurate indexing of health-related data.

[Demo](https://vimeo.com/manage/videos/937456306)

**Contributors:**

- **Adaeze Ani:** Public Health MSc student and Product Manager.
- **Blossom:** Design expert specializing in user interface and experience.
- **Godson:** Developer with expertise in building scalable and reliable applications.

References

- [video](https://vimeo.com/manage/videos/937456306)
- [Blueband Smart-contract](https://github.com/highfeast/blueband/blob/main/smart-contract/contracts/Blueband.sol)
- [IPC](https://docs.ipc.space/)
- [Lighthouse.storage](https://docs.lighthouse.storage/lighthouse-1)
- [Vectra local database](https://github.com/Stevenic/vectra/blob/main/bin/vectra.js)
