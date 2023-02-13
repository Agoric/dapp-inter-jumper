import { vstorageQuery } from './vstorage-query';

const fetchRPCAddr = async (netconfigURL: string) => {
  const response = await fetch(netconfigURL, {
    headers: { accept: 'application/json' },
  });
  const { rpcAddrs } = await response.json();

  return rpcAddrs[Math.floor(Math.random() * rpcAddrs.length)];
};

const networkConfigUrl = (() => {
  const agoricNetName =
    new URLSearchParams(window.location.search).get('network') ?? 'main';

  if (agoricNetName === 'local') {
    return 'https://wallet.agoric.app/wallet/network-config';
  } else {
    return `https://${agoricNetName}.agoric.net/network-config`;
  }
})();

const setMessage = (message: string) => {
  document?.getElementById('msg')?.replaceChildren(message);
  console.info(message);
};

const tryRedirect = async () => {
  const rpc = await fetchRPCAddr(networkConfigUrl);
  let endorsedUI;

  try {
    const data = await vstorageQuery(rpc, 'published.vaultFactory.governance');
    const { values } = JSON.parse(data.value);
    const value = JSON.parse(values[0]);
    const body = JSON.parse(value.body);
    endorsedUI = body.current.EndorsedUI;
  } catch {
    setMessage('Not found.');
    return;
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
