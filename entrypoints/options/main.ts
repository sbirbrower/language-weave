import { browser } from 'wxt/browser';
import { setTheme, startPageTheme } from '@/src/pageTheme';
import type { ResponseFor } from '@/src/messages';
import { modelsFor, PROVIDER_NAMES, type ModelTier, type OtherProvider, type ProviderModels } from '@/src/providers/route';
import { thinkingOff } from '@/src/providers/thinking';
import type { ChatProvider } from '@/src/providers/types';
import { getLanguage } from '@/src/languages';
import { lessonsFor } from '@/src/lessons';
import { getSettings, saveSettings, type Effort, type Thinking } from '@/src/settings';
import type { Theme } from '@/src/theme';

startPageTheme();

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const form = $<HTMLFormElement>('settings');
const provider = $<HTMLSelectElement>('provider');
const providerNote = $<HTMLElement>('providerNote');
const apiKey = $<HTMLInputElement>('apiKey');
const TIERS: ModelTier[] = ['fast', 'main', 'best'];
/** OpenAI's and Gemini's fields: a key, a model per tier, and a button to list the account's models. */
const others = (['openai', 'gemini'] as const).map((id) => ({
  id,
  fields: $<HTMLElement>(`${id}Fields`),
  key: $<HTMLInputElement>(`${id}ApiKey`),
  models: Object.fromEntries(TIERS.map((t) => [t, $<HTMLSelectElement>(`${id}-${t}`)])) as Record<ModelTier, HTMLSelectElement>,
  load: $<HTMLButtonElement>(`${id}LoadModels`),
}));
const googleTtsKey = $<HTMLInputElement>('googleTtsKey');
const typesafeApiKey = $<HTMLInputElement>('typesafeApiKey');
const speaking = $<HTMLInputElement>('speaking');
const deepinfraApiKey = $<HTMLInputElement>('deepinfraApiKey');
const model = $<HTMLSelectElement>('model');
const loadModels = $<HTMLButtonElement>('loadModels');
const effort = $<HTMLSelectElement>('effort');
const thinking = $<HTMLSelectElement>('thinking');
const thinkingNote = $<HTMLElement>('thinkingNote');
const weave = $<HTMLSelectElement>('weave');
const density = $<HTMLInputElement>('density');
const densityValue = $<HTMLOutputElement>('densityValue');
const confirmAbove = $<HTMLInputElement>('confirmAbove');
const topUp = $<HTMLInputElement>('topUp');
const debug = $<HTMLInputElement>('debug');
const status = $<HTMLSpanElement>('status');

function showStatus(text: string, isError = false) {
  status.textContent = text;
  status.classList.toggle('error', isError);
}

function setModelOptions(ids: string[], selected: string, select = model) {
  const all = ids.includes(selected) || !selected ? ids : [selected, ...ids];
  select.replaceChildren(...all.map((id) => new Option(id, id, false, id === selected)));
}

async function listModels(id: ChatProvider, key: string): Promise<string[] | undefined> {
  if (!key) return void showStatus('Enter an API key first.', true);
  showStatus('Loading models…');
  const res: ResponseFor['list-models'] = await browser.runtime.sendMessage({ type: 'list-models', provider: id, apiKey: key });
  if (!res.ok) return void showStatus(res.error, true);
  showStatus(`${res.value.length} models.`);
  return res.value;
}

function showProvider() {
  document.getElementById('anthropicFields')!.hidden = provider.value !== 'anthropic';
  for (const o of others) o.fields.hidden = provider.value !== o.id;
  providerNote.hidden = provider.value === 'anthropic';
  showThinkingNote();
}

function showThinkingNote() {
  const unsupported = provider.value === 'anthropic' && thinking.value === 'off' && thinkingOff(model.value) === 'unsupported';
  thinkingNote.hidden = !unsupported;
  thinkingNote.textContent = unsupported
    ? `${model.value} can't turn thinking off, so it stays slow (several seconds per paragraph). Haiku 5.5 or Sonnet 5.5 can.`
    : '';
}

function showDensity() {
  densityValue.textContent = `${density.value}%`;
}

const themeInputs = [...document.querySelectorAll<HTMLInputElement>('input[name="theme"]')];
// The theme changes at once, without Save: it's only how things look.
for (const input of themeInputs) input.addEventListener('change', () => void setTheme(input.value as Theme));

async function init() {
  const s = await getSettings();
  for (const input of themeInputs) input.checked = input.value === s.theme;
  provider.value = s.provider;
  apiKey.value = s.anthropicApiKey;
  for (const o of others) {
    o.key.value = s[`${o.id}ApiKey`];
    const chosen = modelsFor(s, o.id);
    for (const t of TIERS) setModelOptions([], chosen[t], o.models[t]);
  }
  googleTtsKey.value = s.googleTtsKey;
  typesafeApiKey.value = s.typesafeApiKey;
  speaking.checked = s.speaking;
  deepinfraApiKey.value = s.deepinfraApiKey;
  setModelOptions([], s.model);
  effort.value = s.effort;
  thinking.value = s.thinking;
  weave.replaceChildren(...lessonsFor(getLanguage(s.language)).map((l) => new Option(l.name, l.id)), new Option('Any words (general)', 'none'));
  weave.value = s.weave;
  density.value = String(Math.round(s.density * 100));
  confirmAbove.value = String(s.confirmAboveUsd);
  topUp.checked = s.topUp;
  debug.checked = s.debug;
  showDensity();
  showProvider();
}

// The microphone is allowed for the extension here, once; the offscreen document that records then has it on any page.
speaking.addEventListener('change', async () => {
  if (!speaking.checked) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    showStatus('Microphone allowed. Save to turn speaking exercises on.');
  } catch {
    speaking.checked = false;
    showStatus('Chrome didn’t allow the microphone, so speaking exercises stay off. Allow it in the address bar, then try again.', true);
  }
});

density.addEventListener('input', showDensity);
thinking.addEventListener('change', showThinkingNote);
model.addEventListener('change', showThinkingNote);
provider.addEventListener('change', showProvider);

loadModels.addEventListener('click', async () => {
  const ids = await listModels('anthropic', apiKey.value.trim());
  if (ids) setModelOptions(ids, model.value);
});

for (const o of others) {
  o.load.addEventListener('click', async () => {
    const ids = await listModels(o.id, o.key.value.trim());
    if (ids) for (const t of TIERS) setModelOptions(ids, o.models[t].value, o.models[t]);
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const chosen = provider.value as ChatProvider;
  const key = chosen === 'anthropic' ? apiKey.value : others.find((o) => o.id === chosen)!.key.value;
  if (!key.trim()) return showStatus(`Enter an ${PROVIDER_NAMES[chosen]} API key.`, true);
  if (speaking.checked && !deepinfraApiKey.value.trim()) return showStatus('Speaking exercises need a DeepInfra API key.', true);
  await saveSettings({
    speaking: speaking.checked,
    deepinfraApiKey: deepinfraApiKey.value.trim(),
    provider: chosen,
    anthropicApiKey: apiKey.value.trim(),
    ...Object.fromEntries(others.map((o) => [`${o.id}ApiKey`, o.key.value.trim()])),
    providerModels: Object.fromEntries(
      others.map((o) => [o.id, Object.fromEntries(TIERS.map((t) => [t, o.models[t].value])) as ProviderModels]),
    ) as Record<OtherProvider, ProviderModels>,
    googleTtsKey: googleTtsKey.value.trim(),
    typesafeApiKey: typesafeApiKey.value.trim(),
    model: model.value,
    effort: effort.value as Effort,
    thinking: thinking.value as Thinking,
    weave: weave.value,
    density: Number(density.value) / 100,
    confirmAboveUsd: Math.max(0, Number(confirmAbove.value) || 0),
    topUp: topUp.checked,
    debug: debug.checked,
  });
  showStatus('Saved.');
});

void init();
