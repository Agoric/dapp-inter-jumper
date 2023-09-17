import { vstorageQuery } from './vstorage-query';

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
    redirectParams.append('network', agoricNetName);
    return '?' + redirectParams.toString();
  } else {
    return '';
  }
})();

const bannerParams = (() => {
  if (agoricNetName === 'local') {
    return new URLSearchParams(window.location.search).get('banner') ?? '';
  } else {
    return '';
  }
})();

const fetchNetworkConfig = async (netconfigURL: string) => {
  const response = await fetch(netconfigURL, {
    headers: { accept: 'application/json' },
  });
  const { rpcAddrs, dappInterJumperBanner } = await response.json();

  return {
    rpc: rpcAddrs[Math.floor(Math.random() * rpcAddrs.length)],
    banner: bannerParams || dappInterJumperBanner,
  };
};

const hideMessage = () => {
  const msg = document?.getElementById('msg')!;
  msg.classList.add('hidden');
  msg.classList.remove('flex');
};

const unHide = (element: HTMLElement) => element.classList.remove('hidden');

const setBanner = (message: string) => {
  const msg = document?.getElementById('msg')!;
  msg.replaceChildren(message);
  unHide(msg);
  msg.classList.remove('animate-pulse');

  const noticeHeader = document?.getElementById('notice-header')!;
  unHide(noticeHeader);

  console.info(message);
};

const enableProceedButton = (redirectUrl: URL) => {
  const proceedButtonContainer = document?.getElementById(
    'proceed-button-container'
  )!;
  unHide(proceedButtonContainer);

  const proceedButton = document?.getElementById('proceed-button')!;
  proceedButton.onclick = () => location.replace(redirectUrl);
};

const showError = (msg: string) => {
  const notFoundMessage = document?.getElementById('not-found')!;
  unHide(notFoundMessage);
  notFoundMessage.replaceChildren(msg);
};

const getRedirectUrl = async (rpc: string) => {
  const data = await vstorageQuery(rpc, 'published.vaultFactory.governance');
  const { values } = JSON.parse(data.value);
  const latestValue = values[values.length - 1];
  const value = JSON.parse(latestValue);
  const body = JSON.parse(value.body.substring(1));
  // TODO: remove backwards-compatible "EndorsedUI" after contract change.
  const referencedUI = body.current.ReferencedUI || body.current.EndorsedUI;
  const href = `https://${referencedUI.value}.ipfs.cf-ipfs.com/${redirectParams}`;
  return new URL(href);
};

const tryRedirect = async () => {
  let networkConfig;
  try {
    networkConfig = await fetchNetworkConfig(networkConfigUrl);
  } catch {
    showError(`Network config not found for ${networkConfigUrl}`);
    hideMessage();
    return;
  }

  // Satisfy typescript
  if (!networkConfig) {
    throw new Error('Unexpected error, network config undefined');
  }

  const rpc = networkConfig.rpc;
  const banner = networkConfig.banner;
  const timeoutDurationMS = 10_000;
  let redirectUrl: URL | undefined = undefined;

  try {
    redirectUrl = await (Promise.race([
      getRedirectUrl(rpc),
      new Promise((_, rej) => setTimeout(rej, timeoutDurationMS)),
    ]) as Promise<URL>);
  } catch {
    showError('No endorsed UI found.');
  }

  if (banner) {
    setBanner(banner);
  }

  if (redirectUrl) {
    if (banner) {
      enableProceedButton(redirectUrl);
    } else {
      location.replace(redirectUrl);
    }
  }
};

tryRedirect();
