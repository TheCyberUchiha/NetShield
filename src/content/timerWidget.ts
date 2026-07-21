import browser from 'webextension-polyfill';

(function () {
  const proto = window.location.protocol;
  if (proto !== 'http:' && proto !== 'https:') return;

  const hostname = window.location.hostname.replace(/^www\./, '');
  if (!hostname) return;

  browser.runtime.sendMessage({ action: 'getBypassStatus', domain: hostname }).then((response: any) => {
    if (response?.bypassed) {
      injectTimer(response.expiresAt, hostname);
    }
  }).catch(() => {
    // Background worker asleep, ignore
  });

  function injectTimer(expiresAt: number, domain: string) {
    if (document.getElementById('netshield-bypass-widget')) return;

    const container = document.createElement('div');
    container.id = 'netshield-bypass-widget';
    const shadow = container.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = `
      :host {
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        z-index: 2147483647 !important;
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        padding: 10px 14px !important;
        background: rgba(0, 0, 0, 0.95) !important;
        border: 1px solid #18181b !important;
        border-radius: 8px !important;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03) !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif !important;
        cursor: grab !important;
        user-select: none !important;
        touch-action: none !important;
        transition: border-color 0.3s ease, box-shadow 0.3s ease !important;
        max-width: calc(100vw - 40px) !important;
      }
      :host(:hover) {
        border-color: #22c55e !important;
        box-shadow: 0 10px 30px -5px rgba(34,197,94,0.15), 0 0 0 1px rgba(34,197,94,0.2) !important;
      }
      :host(.dragging) {
        cursor: grabbing !important;
        opacity: 0.92 !important;
      }
      .icon { font-size: 13px; opacity: 0.6; flex-shrink: 0; }
      .label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #a1a1aa; white-space: nowrap; }
      .time { font-family: monospace !important; font-size: 15px; color: #ffffff; font-variant-numeric: tabular-nums; letter-spacing: 1px; min-width: 42px; text-align: right; transition: color 0.3s ease; }
      .time.urgent { color: #ef4444; }
      .sep { width: 1px; height: 22px; background: #18181b; flex-shrink: 0; }
      .relock { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 4px; padding: 5px 10px; font-size: 10px; font-weight: 600; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease; }
      .relock:hover { background: #ef4444; color: #fff; border-color: #ef4444; }
      .relock:active { transform: scale(0.95); }
    `;

    const iconEl = document.createElement('div');
    iconEl.className = 'icon';
    iconEl.textContent = '🛡';

    const labelEl = document.createElement('div');
    labelEl.className = 'label';
    labelEl.textContent = 'Bypass Active';

    const timeEl = document.createElement('div');
    timeEl.className = 'time';
    timeEl.textContent = '--:--';

    const sep = document.createElement('div');
    sep.className = 'sep';

    const relockBtn = document.createElement('button');
    relockBtn.className = 'relock';
    relockBtn.textContent = 'Lock Now';

    shadow.appendChild(style);
    shadow.appendChild(iconEl);
    shadow.appendChild(labelEl);
    shadow.appendChild(timeEl);
    shadow.appendChild(sep);
    shadow.appendChild(relockBtn);
    document.body.appendChild(container);

    // Timer logic
    let expired = false;
    const interval = setInterval(() => {
      const rem = expiresAt - Date.now();
      if (rem <= 0) {
        clearInterval(interval);
        if (!expired) {
          expired = true;
          container.remove();
          window.location.reload();
        }
        return;
      }
      const mins = Math.floor(rem / 60000);
      const secs = Math.floor((rem % 60000) / 1000);
      timeEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      if (rem < 60000) {
        timeEl.classList.add('urgent');
      }
    }, 1000);

    relockBtn.addEventListener('click', () => {
      browser.runtime.sendMessage({ action: 'revokeBypass', domain }).then(() => {
        clearInterval(interval);
        container.remove();
        window.location.reload();
      }).catch(() => {
        // Background asleep or failed — still remove widget and reload
        clearInterval(interval);
        container.remove();
        window.location.reload();
      });
    });

    // Detect external removal of the widget (e.g. by page JS) and stop the interval
    const removalObserver = new MutationObserver(() => {
      if (!document.contains(container)) {
        clearInterval(interval);
        removalObserver.disconnect();
      }
    });
    removalObserver.observe(document.body, { childList: true, subtree: false });

    // Drag-and-drop logic
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialRight = 20;
    let initialBottom = 20;

    container.addEventListener('pointerdown', (e) => {
      isDragging = true;
      container.classList.add('dragging');
      startX = e.clientX;
      startY = e.clientY;
      const computed = window.getComputedStyle(container);
      initialRight = parseInt(computed.right) || 20;
      initialBottom = parseInt(computed.bottom) || 20;
      container.setPointerCapture(e.pointerId);
    });

    container.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // Restrict positioning inside viewport bounds
      const right = Math.max(10, Math.min(window.innerWidth - container.offsetWidth - 10, initialRight - dx));
      const bottom = Math.max(10, Math.min(window.innerHeight - container.offsetHeight - 10, initialBottom - dy));

      container.style.right = `${right}px`;
      container.style.bottom = `${bottom}px`;
    });

    container.addEventListener('pointerup', (e) => {
      if (isDragging) {
        isDragging = false;
        container.classList.remove('dragging');
        container.releasePointerCapture(e.pointerId);
      }
    });

    // Handle pointer cancel (e.g. context menu, touch interruption)
    container.addEventListener('pointercancel', (e) => {
      if (isDragging) {
        isDragging = false;
        container.classList.remove('dragging');
        container.releasePointerCapture(e.pointerId);
      }
    });
  }
})();
