import { scratchKey, freshPractice, restorePractice, selectedAnswer, answerCorrect } from '/offline/practice-state.mjs';
import { readOfflineLanguages, offlineText } from '/offline/language.mjs';

const content = document.getElementById('practice-content');
const practice = document.getElementById('practice');
const storageStatus = document.getElementById('storage-status');
const status = document.getElementById('connection-status');
let pack, state = null, level = 'A1', checkingConnection = false, exerciseVisible = false;
let languages = readOfflineLanguages({ getItem: key => localStorage.getItem(key) });
const ui = text => offlineText(text, languages.ui);
const support = text => offlineText(text, languages.support);
const lessonTitle = lesson => languages.ui === 'en' ? lesson.titleEnglish : lesson.title;

function showStatus(node, text) { node.dataset.messageKey = text; node.textContent = ui(text); }
function applyLanguages() {
  document.documentElement.lang = languages.ui;
  document.documentElement.dataset.supportLanguage = languages.support;
  document.title = ui('Uma pausa na conexão · Sparky English');
  for (const node of document.querySelectorAll('[data-ui], [data-support]')) {
    node.dataset.offlineOriginal ??= node.textContent;
    const locale = node.hasAttribute('data-support') ? languages.support : languages.ui;
    node.textContent = offlineText(node.dataset.offlineOriginal, locale); node.lang = locale;
  }
  for (const node of document.querySelectorAll('[data-ui-alt]')) { node.dataset.offlineOriginal ??= node.alt; node.alt = ui(node.dataset.offlineOriginal); }
  for (const node of [status, storageStatus]) if (node.dataset.messageKey) showStatus(node, node.dataset.messageKey);
  document.getElementById('offline-interface-language').value = languages.ui;
  document.getElementById('offline-support-language').value = languages.support;
}
applyLanguages();
for (const [id, property] of [['offline-interface-language', 'ui'], ['offline-support-language', 'support']]) {
  document.getElementById(id).addEventListener('change', event => {
    languages = { ...languages, [property]: event.target.value === 'en' ? 'en' : 'pt-BR' };
    try { localStorage.setItem('sparky-interface-language', languages.ui); localStorage.setItem('sparky-support-language', languages.support); } catch { /* Choices work during this visit even without storage. */ }
    applyLanguages();
    if (pack) { if (exerciseVisible) renderExercise(); else renderLibrary(); }
  });
}

function element(tag, text, className, target = false) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = target ? text : ui(text);
  if (className) node.className = className;
  return node;
}
function button(text, action, className = 'secondary', target = false) {
  const node = element('button', text, className, target);
  node.type = 'button'; node.addEventListener('click', action);
  return node;
}
function persist() {
  try { localStorage.setItem(scratchKey, JSON.stringify(state)); }
  catch { showStatus(storageStatus, 'Você pode praticar, mas este navegador não conseguiu guardar o ponto de parada.'); }
}
function focusHeading() {
  content.querySelector('h3')?.focus({ preventScroll: true });
}
function start(lesson) {
  state = freshPractice(pack, lesson.id); persist(); renderExercise(); focusHeading();
}
function renderLibrary() {
  exerciseVisible = false;
  content.replaceChildren();
  if (state && state.index < pack.lessons.find(item => item.id === state.lessonId).exercises.length) {
    const lesson = pack.lessons.find(item => item.id === state.lessonId);
    const resume = element('div', undefined, 'resume-card');
    resume.append(element('p', `${lessonTitle(lesson)} · ${ui('Questão')} ${state.index + 1} ${ui('de')} ${lesson.exercises.length}`), button('Continuar prática salva', () => { renderExercise(); focusHeading(); }));
    content.append(resume);
  }
  const levels = element('div', undefined, 'level-picker'); levels.setAttribute('aria-label', ui('Nível de prática'));
  for (const value of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
    const option = button(value, () => { level = value; renderLibrary(); content.querySelector(`[data-level="${value}"]`)?.focus(); }, '');
    option.dataset.level = value; option.setAttribute('aria-pressed', String(level === value)); levels.append(option);
  }
  content.append(levels);
  const list = element('div', undefined, 'lesson-list');
  for (const lesson of pack.lessons.filter(item => item.level === level)) {
    const item = button('', () => start(lesson), 'lesson-card');
    const copy = element('span'); copy.append(element('strong', lessonTitle(lesson), undefined, true), element('small', `${lesson.level} · ${lesson.exercises.length} ${ui('exercícios')}`));
    item.append(copy, element('span', '→')); list.append(item);
  }
  content.append(list);
}
function renderSupport(lesson) {
  if (!lesson.support?.length) return;
  const details = element('details', undefined, 'support'); details.append(element('summary', 'Consultar exemplos e explicações'));
  for (const step of lesson.support) {
    const title = element('h3', languages.support === 'en' ? step.titleEnglish : step.title, undefined, true); title.lang = languages.support;
    const body = element('p', languages.support === 'en' ? step.bodyEnglish : step.body, undefined, true); body.lang = languages.support;
    details.append(title, body);
    if (step.english) { const english = element('p', step.english, undefined, true); english.lang = 'en'; details.append(english); }
    if (step.translation) {
      const translation = element('details', undefined, 'translation'); translation.append(element('summary', 'Ver tradução em português'));
      const portuguese = element('p', step.translation, undefined, true); portuguese.lang = 'pt-BR'; translation.append(portuguese); details.append(translation);
    }
  }
  content.append(details);
}
function renderExercise() {
  exerciseVisible = true;
  const lesson = pack.lessons.find(item => item.id === state.lessonId);
  const step = lesson.exercises[state.index];
  content.replaceChildren();
  const header = element('div', undefined, 'exercise-header');
  header.append(button('← Escolher outra prática', renderLibrary, 'small-button'), element('span', `${lesson.level} · ${Math.min(state.index + 1, lesson.exercises.length)}/${lesson.exercises.length}`, 'exercise-position'));
  content.append(header);
  const heading = element('h3', step ? lessonTitle(lesson) : ui('Prática terminada!'), 'exercise-title', true); heading.tabIndex = -1; content.append(heading);
  if (!step) {
    const finished = element('p', support('Bom trabalho. Você praticou inglês mesmo durante a pausa na conexão. Ao voltar ao Sparky, retome sua trilha com a conta conectada.'), undefined, true); finished.lang = languages.support;
    content.append(finished, button('Praticar de novo', () => start(lesson)));
    return;
  }
  const prompt = element('p', languages.support === 'en' ? step.bodyEnglish : step.body, 'exercise-prompt', true); prompt.lang = languages.support; content.append(prompt);
  if (step.english) { const cue = element('p', step.english, 'english-prompt', true); cue.lang = 'en'; content.append(cue); }
  if (step.contextHint) { const hint = element('p', languages.support === 'en' ? step.contextHint.english : step.contextHint.portuguese, 'exercise-hint', true); hint.lang = languages.support; content.append(hint); }
  if (step.cue) {
    const meaning = element('details', undefined, 'meaning'); meaning.append(element('summary', 'Ver significado em português'));
    const cue = element('p', step.cue, undefined, true); cue.lang = 'pt-BR'; meaning.append(cue); content.append(meaning);
  }
  if (step.kind === 'order_words') {
    const assembled = element('div', undefined, 'assembled'); assembled.setAttribute('aria-label', ui('Sua frase')); assembled.dataset.emptyLabel = ui('Toque nas palavras para montar a frase');
    for (const [position, token] of state.tokens.entries()) {
      const word = button(step.options[token], () => { state.tokens.splice(position, 1); persist(); renderExercise(); }, '', true);
      word.lang = 'en'; word.disabled = state.checked; word.setAttribute('aria-label', `${ui('Remover')} ${step.options[token]} ${ui('da posição')} ${position + 1}`); assembled.append(word);
    }
    const bank = element('div', undefined, 'word-bank'); bank.setAttribute('aria-label', ui('Palavras disponíveis'));
    for (const [index, text] of step.options.entries()) {
      const word = button(text, () => { state.tokens.push(index); persist(); renderExercise(); content.querySelector('.word-bank button:not(:disabled)')?.focus({ preventScroll: true }); }, '', true);
      word.lang = 'en'; word.disabled = state.checked || state.tokens.includes(index); word.dataset.token = String(index); bank.append(word);
    }
    content.append(assembled, bank);
  } else {
    const options = element('fieldset', undefined, 'options'); options.append(element('legend', 'Escolha uma resposta', 'sr-only'));
    for (const [index, text] of step.options.entries()) {
      const option = button(text, () => { state.choice = index; persist(); renderExercise(); content.querySelector(`[data-option="${index}"]`)?.focus({ preventScroll: true }); }, '', true);
      option.lang = 'en'; option.dataset.option = String(index); option.disabled = state.checked; option.setAttribute('aria-pressed', String(state.choice === index)); options.append(option);
    }
    content.append(options);
  }
  const ready = step.kind === 'order_words' ? state.tokens.length === step.options.length : Boolean(selectedAnswer(lesson, state));
  if (state.checked) {
    const correct = answerCorrect(lesson, state);
    const feedback = element('div', undefined, 'feedback'); feedback.setAttribute('role', 'status');
    const explanation = element('p', languages.support === 'en' ? step.explanationEnglish : step.explanation, undefined, true); explanation.lang = languages.support;
    feedback.append(element('strong', correct ? 'Muito bem!' : 'Vamos tentar mais uma vez?'), explanation); content.append(feedback);
    content.append(button(correct ? (state.index === lesson.exercises.length - 1 ? 'Terminar prática' : 'Próxima questão →') : 'Tentar outra vez', () => {
      if (correct) state = { ...state, index: state.index + 1, choice: null, tokens: [], checked: false };
      else state = { ...state, choice: null, tokens: [], checked: false };
      persist(); renderExercise(); focusHeading();
    }, 'primary'));
  } else {
    const actions = element('div', undefined, 'actions');
    const verify = button('Verificar', () => { state.checked = true; persist(); renderExercise(); content.querySelector('.feedback')?.scrollIntoView({ block: 'nearest' }); content.querySelector('.primary')?.focus({ preventScroll: true }); }, 'primary');
    verify.disabled = !ready; actions.append(verify); content.append(actions);
  }
  renderSupport(lesson);
}

async function retry(event) {
  event.preventDefault();
  if (checkingConnection) return;
  checkingConnection = true; showStatus(status, 'Verificando a conexão…');
  try {
    const response = await fetch('/api/release?offline-check=' + Date.now(), { cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('unavailable');
    // This standalone cached document has no Next/React router; use a fresh network navigation after recovery.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign('/');
  } catch { showStatus(status, 'Ainda não conseguimos nos conectar. Sua prática continua disponível aqui.'); }
  finally { checkingConnection = false; }
}
document.getElementById('retry').addEventListener('click', retry);
document.getElementById('start-practice').addEventListener('click', async () => {
  practice.hidden = false; document.getElementById('practice-title').focus({ preventScroll: true }); practice.scrollIntoView({ block: 'start', behavior: 'instant' });
  await loaded;
  if (pack) renderLibrary();
});
document.getElementById('close-practice').addEventListener('click', () => { practice.hidden = true; document.getElementById('start-practice').focus(); });
window.addEventListener('online', () => { showStatus(status, 'A conexão pode ter voltado. Toque em Tentar novamente quando quiser voltar ao Sparky.'); });
window.addEventListener('offline', () => { showStatus(status, 'Sem internet no momento. Você pode continuar a prática salva.'); });
window.addEventListener('storage', event => {
  if (event.key === scratchKey && event.newValue === null) { state = null; if (pack && !practice.hidden) renderLibrary(); }
  if (['sparky-interface-language', 'sparky-support-language'].includes(event.key)) {
    languages = readOfflineLanguages({ getItem: key => localStorage.getItem(key) }); applyLanguages();
    if (pack) { if (exerciseVisible) renderExercise(); else renderLibrary(); }
  }
});
if (!navigator.onLine) showStatus(status, 'Sem internet no momento. Você pode continuar a prática salva.');
const loaded = (async () => {
  try {
    const response = await fetch('/offline/practice.json', { cache: 'no-store', credentials: 'omit' });
    if (!response.ok) throw new Error('pack-unavailable');
    pack = await response.json();
    if (pack.version !== 1 || !Array.isArray(pack.lessons) || !pack.lessons.length) throw new Error('pack-invalid');
    try {
      const raw = localStorage.getItem(scratchKey);
      if (raw && raw.length <= 4096) state = restorePractice(pack, JSON.parse(raw));
      if (raw && !state) { localStorage.removeItem(scratchKey); showStatus(storageStatus, 'A prática salva mudou. Escolha uma lição para começar de novo.'); }
    } catch { /* Practice remains usable when local storage is unavailable. */ }
    if (state) level = pack.lessons.find(item => item.id === state.lessonId).level;
    renderLibrary();
  } catch {
    content.replaceChildren(element('p', 'O conteúdo de prática ainda não foi salvo neste aparelho. Volte ao Sparky quando a conexão retornar para prepará-lo.'));
  }
})();
if (window.location.hash === '#practice') document.getElementById('start-practice').click();
