import { vstorageQuery } from './vstorage-query';

const fetchRPCAddr = async (netconfigURL: string) => {
  const response = await fetch(netconfigURL, {
    headers: { accept: 'application/json' },
  });
  const { rpcAddrs } = await response.json();

  return rpcAddrs[Math.floor(Math.random() * rpcAddrs.length)];
};

const agoricNetName =
  new URLSearchParams(window.location.search).get('network') ?? 'main';

const networkConfigUrl = (() => {
  if (agoricNetName === 'local') {
    return 'https://wallet.agoric.app/wallet/network-config';
  } else {
    return `https://${agoricNetName}.agoric.net/network-config`;
  }
})();

const redirectParams = (() => {
  if (agoricNetName !== 'main') {
    const redirectParams = new URLSearchParams();
    redirectParams.append('wallet', 'main');
    redirectParams.append('network', agoricNetName);
    return '?' + redirectParams.toString();
  } else {
    return '';
  }
})();

const setMessage = (message: string) => {
  document?.getElementById('msg')?.replaceChildren(message);
  console.info(message);
};

const tryRedirect = async () => {
  const rpc = await fetchRPCAddr(networkConfigUrl);
  let referencedUI;

  try {
    const data = await vstorageQuery(rpc, 'published.vaultFactory.governance');
    const { values } = JSON.parse(data.value);
    const latestValue = values[values.length - 1];
    const value = JSON.parse(latestValue);
    const body = JSON.parse(value.body.substring(1));
    // TODO: remove backwards-compatible "EndorsedUI" after contract change.
    referencedUI = body.current.ReferencedUI || body.current.EndorsedUI;
  } catch {
    setMessage('Not found.');
    return;
  }

  if (!referencedUI) {
    setMessage('Not found.');
  } else {
    try {
      const href = `https://${referencedUI.value}.ipfs.cf-ipfs.com/${redirectParams}`;
      const redirectUrl = new URL(href);
      location.replace(redirectUrl);
    } catch (e) {
      console.error(e, referencedUI.value);
      setMessage('Not found: ' + referencedUI.value);
    }
  }
};

tryRedirect();
