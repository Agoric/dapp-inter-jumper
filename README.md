# dapp-inter-jumper

Jumper page for dapp-inter.

Simply redirects to the currently referenced [dapp-inter](https://github.com/Agoric/dapp-inter)
site as voted on by the Inter Protocol Econ Committee.

# Development

`yarn install && yarn dev`

To use a different network config add `?network=<NETWORK NAME>` to the URL.
Then it will use `https://<NETWORK NAME>.agoric.net/network-config`.

For local development, use `?network=local`, then it will use
`https://wallet.agoric.app/wallet/network-config`

When `network=local` you may also set `?banner=blahblah` to test banners.
`?network=local&banner=are%20you%20seeing%20this%20banner`

# Deployment

`yarn install && yarn build` will create a static SPA in the `dist` folder.
To preview the build, use `yarn preview`.
