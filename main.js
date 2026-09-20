// ==UserScript==
// @name         sounds.surf volume slider
// @description  volume slider for sounds.surf
// @namespace    http://tampermonkey.net/
// @version      2.0
// @match        https://sounds.surf/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function ()
{
  'use strict';

  const default_volume = 100;
  const patched_audios = new Set();

  let volume = GM_getValue('volume', default_volume);

  function patch_item(item)
  {
    if (item._volume_detour)
    {
      return;
    }

    item._volume_detour = true;

    let audio = item._audio;

    Object.defineProperty(item, '_audio', {

      configurable: true,

      get()
      {
        return audio;
      },

      set(value)
      {
        audio = value;

        if (audio)
        {
          audio.volume = volume / 100;
          patched_audios.add(audio);
        }

      }
    });


    if (audio)
    {
      audio.volume = volume / 100;
      patched_audios.add(audio);
    }

  }

  function apply_volume(new_volume)
  {
    volume = new_volume;
    GM_setValue('volume', new_volume);

    patched_audios.forEach((audio) =>
    {

      try
      {
        audio.volume = new_volume / 100;
      }

      catch (e)
      {
        //
      }
    });

    document.querySelectorAll('audio').forEach((audio) =>
    {
      audio.volume = new_volume / 100;
    });
  }

  function build_ui()
  {
    const box = document.createElement('div');
    box.style.cssText =
    `
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 999999;
      background: rgba(0,0,0,0.75);
      color: #fff;
      display: flex;
      align-items: center;
      gap: 10px;
    `;

    const label = document.createElement('span');
    label.textContent = volume + '%';
    label.style.cssText = 'min-width: 36px; text-align: right; font-variant-numeric: tabular-nums;';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = volume;
    slider.style.cssText = 'width: 140px; cursor: pointer;';

    slider.addEventListener('input', () =>
    {
      const new_volume = Number(slider.value);
      label.textContent = new_volume + '%';
      apply_volume(new_volume);
    });

    box.appendChild(slider);
    box.appendChild(label);

    let dragging = false;
    let offset_x = 0;
    let offset_y = 0;

    box.addEventListener('mousedown', (e) =>
    {
      if (e.target === slider)
      {
        return;
      }

      dragging = true;
      offset_x = e.clientX - box.getBoundingClientRect().left;
      offset_y = e.clientY - box.getBoundingClientRect().top;

      box.style.right = 'auto';
      box.style.bottom = 'auto';

      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) =>
    {
      if (!dragging)
      {
        return;
      }

      box.style.left = (e.clientX - offset_x) + 'px';
      box.style.top = (e.clientY - offset_y) + 'px';
    });

    window.addEventListener('mouseup', () =>
    {
      dragging = false;
    });

    document.body.appendChild(box);
  }

  function main()
  {
    new MutationObserver(() =>

      document.querySelectorAll('.file-item').forEach(patch_item)

    ).observe(document.body, { childList: true, subtree: true });

    document.querySelectorAll('.file-item').forEach(patch_item);

    build_ui();
    apply_volume(volume);
  }

  main();

})();
