import '@endo/init';
import { iterateLatest, makeFollower, makeLeader } from '@agoric/casting';

const urlSearchParams = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop.toString()),
}) as { network?: string };

const networkConfigUrl = (() => {
  const agoricNetName = urlSearchParams.network ?? 'main';

  if (agoricNetName === 'local') {
    return 'https://wallet.agoric.app/wallet/network-config';
  } else {
    return `https://${agoricNetName}.agoric.net/network-config`;
  }
})();

const leader = makeLeader(networkConfigUrl);
const castingSpec = ':published.vaultFactory.governance';
const follower = makeFollower(castingSpec, leader);

type Params = { current: { EndorsedUI: { type: 'string'; value: string } } };

const tryRedirect = async () => {
  let endorsedUI;
  for await (const { value } of iterateLatest<{ value: Params }>(follower)) {
    endorsedUI = value.current.EndorsedUI;
    break;
  }

  if (!endorsedUI) {
    document?.getElementById('msg')?.replaceChildren('Not found.');
  } else if (endorsedUI.value === 'NO ENDORSEMENT') {
    document
      ?.getElementById('msg')
      ?.replaceChildren('Not found: No Endorsement');
  } else {
    try {
      const href = `https://${endorsedUI.value}.ipfs.cf-ipfs.com`;
      const redirectUrl = new URL(href);
      location.replace(redirectUrl);
    } catch (e) {
      console.error(e, endorsedUI.value);
      document
        ?.getElementById('msg')
        ?.replaceChildren('Not found: ', endorsedUI.value);
    }
  }
};

tryRedirect();
