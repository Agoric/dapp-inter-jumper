import '@endo/init';
import { iterateLatest, makeFollower, makeLeader } from '@agoric/casting';

const networkConfigUrl = (() => {
  const agoricNetName =
    new URLSearchParams(window.location.search).get('network') ?? 'main';

  if (agoricNetName === 'local') {
    return 'https://wallet.agoric.app/wallet/network-config';
  } else {
    return `https://${agoricNetName}.agoric.net/network-config`;
  }
})();

const leader = makeLeader(networkConfigUrl);
const follower = makeFollower(':published.vaultFactory.governance', leader);

type Params = { current: { EndorsedUI: { type: 'string'; value: string } } };

const setMessage = (message: string) => {
  document?.getElementById('msg')?.replaceChildren(message);
  console.info(message);
};

const tryRedirect = async () => {
  let endorsedUI;
  for await (const { value } of iterateLatest<{ value: Params }>(follower)) {
    endorsedUI = value.current.EndorsedUI;
    break;
  }

  if (!endorsedUI) {
    setMessage('Not found.');
  } else if (endorsedUI.value === 'NO ENDORSEMENT') {
    setMessage('Not found: No Endorsement');
  } else {
    try {
      const href = `https://${endorsedUI.value}.ipfs.cf-ipfs.com`;
      const redirectUrl = new URL(href);
      location.replace(redirectUrl);
    } catch (e) {
      console.error(e, endorsedUI.value);
      setMessage('Not found: ' + endorsedUI.value);
    }
  }
};

tryRedirect();
