(() => {
  const data = window.SITE_DATA;
  const grid = document.getElementById('exerciseGrid');
  const search = document.getElementById('exerciseSearch');
  const tabs = [...document.querySelectorAll('.tab')];
  const quizPanel = document.getElementById('quizPanel');
  let activeCategory = 'superiores';
  let activeQuizKey = null;
  let questionIndex = 0;
  let answers = [];

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const materialNames = { PC: 'Peso corporal', BE: 'Banda elástica', MO: 'Mochila / garrafas', TO: 'Toalla' };

  function renderExercises() {
    const query = search.value.trim().toLocaleLowerCase('es');
    const items = data.exercises.filter(item => item.category === activeCategory && (!query || `${item.name} ${item.material} ${item.summary} ${item.muscles}`.toLocaleLowerCase('es').includes(query)));
    grid.innerHTML = '';
    if (!items.length) {
      grid.innerHTML = '<div class="empty-state">No se han encontrado ejercicios con esa búsqueda.</div>';
      return;
    }
    items.forEach((item, index) => {
      const card = document.createElement('article');
      card.className = 'exercise-card';
      const videoFile = `${data.categories[item.category].folder}${String(index + 1).padStart(2,'0')}-${item.id}.mp4`;
      card.innerHTML = `
        <div class="exercise-card-top"><span class="exercise-num">${String(index + 1).padStart(2,'0')} / 15</span><span class="material-tag">${escapeHtml(item.material)} · ${escapeHtml(materialNames[item.material])}</span></div>
        <h3>${escapeHtml(item.name)}</h3>
        <p class="exercise-summary">${escapeHtml(item.summary)}</p>
        <div class="exercise-card-bottom"><span>Ficha de ejercicio</span><button class="details-button" type="button" aria-expanded="false">Ver detalles +</button></div>
        <div class="exercise-details" hidden>
          <p><strong>Técnica de ejecución</strong><br>${escapeHtml(item.technique)}</p>
          <p><strong>Musculatura implicada</strong><br>${escapeHtml(item.muscles)}</p>
          <p><strong>Prerrequisitos</strong><br>${escapeHtml(item.prerequisites)}</p>
          ${item.videoUrl ? videoMarkup(item.videoUrl, item.name) : `<div class="video-placeholder"><strong>Vídeo pendiente de incorporar</strong><br>Archivo previsto: <code>${escapeHtml(videoFile)}</code><br>La demostración grabada y la voz en off se añadirán aquí.</div>`}
        </div>`;
      const button = card.querySelector('.details-button');
      const details = card.querySelector('.exercise-details');
      button.addEventListener('click', () => {
        const isOpen = !details.hidden;
        details.hidden = isOpen;
        button.setAttribute('aria-expanded', String(!isOpen));
        button.textContent = isOpen ? 'Ver detalles +' : 'Cerrar detalles −';
      });
      grid.appendChild(card);
    });
  }

  function videoMarkup(url, title) {
    const safe = escapeHtml(url);
    if (/youtube\.com\/embed\//.test(url) || /player\.vimeo\.com\/video\//.test(url)) {
      return `<div class="video-embed"><iframe src="${safe}" title="Vídeo: ${escapeHtml(title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
    }
    return `<video class="exercise-video" controls preload="metadata"><source src="${safe}">Tu navegador no puede reproducir este vídeo.</video>`;
  }

  function setCategory(category) {
    activeCategory = category;
    tabs.forEach(tab => {
      const selected = tab.dataset.category === category;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-selected', String(selected));
    });
    renderExercises();
  }
  tabs.forEach(tab => tab.addEventListener('click', () => setCategory(tab.dataset.category)));
  document.querySelectorAll('[data-open-category]').forEach(link => link.addEventListener('click', () => setCategory(link.dataset.openCategory)));
  search.addEventListener('input', renderExercises);

  function openQuiz(key) {
    activeQuizKey = key;
    questionIndex = 0;
    answers = [];
    quizPanel.hidden = false;
    renderQuestion();
    quizPanel.scrollIntoView({behavior:'smooth', block:'start'});
  }

  function closeQuiz() {
    quizPanel.hidden = true;
    activeQuizKey = null;
  }

  function renderQuestion() {
    const quiz = data.quizzes[activeQuizKey];
    const q = quiz.questions[questionIndex];
    const chosen = answers[questionIndex];
    const progress = ((questionIndex + 1) / quiz.questions.length) * 100;
    quizPanel.innerHTML = `
      <div class="quiz-topline"><span>${escapeHtml(quiz.title)} · Pregunta ${questionIndex + 1} de ${quiz.questions.length}</span><button class="quiz-close" id="quizClose" type="button">Cerrar cuestionario ×</button></div>
      <div class="quiz-progress"><span style="width:${progress}%"></span></div>
      <h3 class="quiz-question">${escapeHtml(q[0])}</h3>
      <div class="quiz-options">${q[1].map((option, i) => `<button type="button" class="quiz-option ${chosen !== undefined && i === q[2] ? 'correct' : ''} ${chosen === i && chosen !== q[2] ? 'incorrect' : ''}" data-option="${i}" ${chosen !== undefined ? 'disabled' : ''}><strong>${String.fromCharCode(65+i)}.</strong> ${escapeHtml(option)}</button>`).join('')}</div>
      ${chosen !== undefined ? `<div class="quiz-feedback"><strong>${chosen === q[2] ? '¡Correcto!' : 'No es esa opción.'}</strong> ${escapeHtml(q[3])}</div>` : ''}
      <div class="quiz-actions"><span class="quiz-topline">${answers.filter((a,i) => a === quiz.questions[i][2]).length} respuestas correctas hasta ahora</span><button class="quiz-next" id="quizNext" type="button" ${chosen === undefined ? 'disabled' : ''}>${questionIndex === quiz.questions.length - 1 ? 'Ver resultado' : 'Siguiente pregunta'} →</button></div>`;
    quizPanel.querySelectorAll('[data-option]').forEach(btn => btn.addEventListener('click', () => {
      if (answers[questionIndex] !== undefined) return;
      answers[questionIndex] = Number(btn.dataset.option);
      renderQuestion();
    }));
    document.getElementById('quizNext').addEventListener('click', () => {
      if (answers[questionIndex] === undefined) return;
      if (questionIndex < quiz.questions.length - 1) { questionIndex++; renderQuestion(); }
      else renderResult();
    });
    document.getElementById('quizClose').addEventListener('click', closeQuiz);
  }

  function renderResult() {
    const quiz = data.quizzes[activeQuizKey];
    const score = answers.reduce((sum, answer, index) => sum + (answer === quiz.questions[index][2] ? 1 : 0), 0);
    const message = score >= 9 ? '¡Excelente! Tienes muy claros los conceptos.' : score >= 7 ? '¡Buen trabajo! Has comprendido gran parte del contenido.' : score >= 5 ? 'Vas por buen camino. Repasa las explicaciones y vuelve a intentarlo.' : 'Este es un buen punto de partida para aprender. Revisa las fichas y prueba otra vez.';
    quizPanel.innerHTML = `
      <div class="quiz-result"><div class="section-kicker">Cuestionario completado</div><div class="quiz-score">${score}<span style="font-size:25px;color:#94a18f"> / 10</span></div><h3>${escapeHtml(message)}</h3><p>Has respondido las diez preguntas de ${escapeHtml(quiz.title.toLowerCase())}.</p>
        <div class="debate-box"><strong>Para reflexionar</strong><p>${escapeHtml(quiz.debate)}</p><textarea id="debateAnswer" placeholder="Escribe aquí tu reflexión (opcional)..." aria-label="Tu reflexión"></textarea></div>
        <div class="quiz-actions"><button class="quiz-close" id="reviewQuiz" type="button">Revisar respuestas</button><button class="quiz-restart" id="restartQuiz" type="button">Repetir cuestionario ↻</button></div>
      </div>`;
    document.getElementById('reviewQuiz').addEventListener('click', () => { questionIndex = 0; renderQuestion(); });
    document.getElementById('restartQuiz').addEventListener('click', () => openQuiz(activeQuizKey));
  }

  document.querySelectorAll('[data-quiz]').forEach(button => button.addEventListener('click', () => openQuiz(button.dataset.quiz)));
  document.getElementById('menuToggle').addEventListener('click', () => {
    const nav = document.getElementById('mainNav');
    const open = nav.classList.toggle('open');
    document.getElementById('menuToggle').setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('.main-nav a').forEach(link => link.addEventListener('click', () => document.getElementById('mainNav').classList.remove('open')));
  document.getElementById('year').textContent = new Date().getFullYear();
  document.getElementById('yearFooter').textContent = new Date().getFullYear();
  renderExercises();
})();
