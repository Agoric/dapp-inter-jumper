# dapp-inter-jumper
Jumper page for dapp-inter.

Simply redirects to the currently endorsed [dapp-inter](https://github.com/Agoric/dapp-inter)
site as voted on by the Inter Protocol Econ Committee.

# Development

`yarn install && yarn dev`

To use a different network config add `?network=<NETWORK NAME>` to the URL.
Then it will use `https://<NETWORK NAME>.agoric.net/network-config`.
For local development, use `?network=local`, then it will use
`https://wallet.agoric.app/wallet/network-config`

# Deployment

`yarn install && yarn build` will create a static SPA in the `dist` folder.
To preview the build, use `yarn preview`.
