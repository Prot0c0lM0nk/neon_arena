/**
 * Phase UI utilities
 * Handles countdown/intermission overlays and crosshair visibility.
 */

let bannerTimeout = null;
let pickupTimeout = null;

function get(id) {
    return document.getElementById(id);
}

export function showCountdown(value) {
    const banner = get('phaseBanner');
    if (!banner) return;

    if (bannerTimeout) {
        clearTimeout(bannerTimeout);
        bannerTimeout = null;
    }

    if (value === null || value === undefined) {
        banner.style.display = 'none';
        banner.textContent = '';
        return;
    }

    banner.textContent = `${value}`;
    banner.style.display = 'block';
}

export function showRoundBanner(text, duration = 1200) {
    const banner = get('phaseBanner');
    if (!banner) return;

    if (bannerTimeout) {
        clearTimeout(bannerTimeout);
    }

    banner.textContent = text;
    banner.style.display = 'block';

    if (duration > 0) {
        bannerTimeout = setTimeout(() => {
            banner.style.display = 'none';
            banner.textContent = '';
            bannerTimeout = null;
        }, duration);
    }
}

export function showIntermissionTimer(secondsRemaining) {
    const timer = get('intermissionTimer');
    if (!timer) return;

    if (secondsRemaining === null || secondsRemaining === undefined) {
        timer.style.display = 'none';
        timer.textContent = '';
        return;
    }

    timer.textContent = `INTERMISSION: ${Math.max(0, Math.ceil(secondsRemaining))}s`;
    timer.style.display = 'block';
}

export function setCrosshairVisible(isVisible) {
    const crosshair = get('crosshair');
    if (!crosshair) return;
    crosshair.style.display = isVisible ? 'block' : 'none';
}

export function showPickupNotice(text, duration = 1800) {
    const notice = get('pickupNotice');
    if (!notice) return;

    if (pickupTimeout) {
        clearTimeout(pickupTimeout);
    }

    notice.textContent = text;
    notice.style.display = 'block';

    pickupTimeout = setTimeout(() => {
        notice.style.display = 'none';
        notice.textContent = '';
        pickupTimeout = null;
    }, duration);
}
