import { timeoutDurationMS } from './constants';
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
  const { apiAddrs, dappInterJumperBanner } = await response.json();

  return {
    apiAddrs,
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

const getRedirectUrl = async (apiAddrs: string[]) => {
  const data = await vstorageQuery(
    apiAddrs,
    'published.vaultFactory.governance'
  );
  const { values } = JSON.parse(data.value);
  const latestValue = values[values.length - 1];
  const value = JSON.parse(latestValue);
  const body = JSON.parse(value.body.substring(1));
  const referencedUI = body.current.ReferencedUI;
  const href = `https://${referencedUI.value}.ipfs.dweb.link/${redirectParams}`;
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

  const { apiAddrs, banner } = networkConfig;
  let redirectUrl: URL | undefined = undefined;
  let didFail = false;

  setTimeout(() => {
    if (!didFail && !redirectUrl) {
      showError('Connection is taking longer than expected. Please wait.');
    }
  }, timeoutDurationMS);

  try {
    redirectUrl = await getRedirectUrl(apiAddrs);
  } catch (e) {
    didFail = true;
    console.error(e);
    hideMessage();
    showError(
      'Problem connecting to chain - this may be due to RPC connection issues. See console for more information or please try again later.'
    );
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
