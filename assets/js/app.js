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

  // --- Sistema de Ranking y LocalStorage ---
  function obtenerRankingLocal(tipo) {
    const clave = `quiz_ranking_cafyd_${tipo}`;
    const guardado = localStorage.getItem(clave);
    if (guardado) {
      return JSON.parse(guardado);
    }
    // Datos base iniciales por categoría
    return [
      { nombre: "Carlos M.", aciertos: 9, total: 10, porcentaje: 90 },
      { nombre: "Lucía D.", aciertos: 8, total: 10, porcentaje: 80 },
      { nombre: "Alejandro P.", aciertos: 7, total: 10, porcentaje: 70 }
    ];
  }

  function guardarYMostrarRanking(nombre, aciertos, total, porcentaje, tipo) {
    const clave = `quiz_ranking_cafyd_${tipo}`;
    let ranking = obtenerRankingLocal(tipo);

    const nuevoResultado = {
      nombre,
      aciertos,
      total,
      porcentaje,
      esActual: true
    };

    ranking.forEach(item => delete item.esActual);
    ranking.push(nuevoResultado);
    ranking.sort((a, b) => b.porcentaje - a.porcentaje || b.aciertos - a.aciertos);

    localStorage.setItem(clave, JSON.stringify(ranking));
    renderizarTablaRanking(nombre, aciertos, total, porcentaje, tipo);
  }

  function renderizarTablaRanking(nombreUsuarioActual, aciertos, total, porcentaje, tipo) {
    const container = document.getElementById('rankingContainer');
    if (!container) return;

    const ranking = obtenerRankingLocal(tipo);
    const mejores = ranking.filter(item => item.porcentaje < porcentaje).length;
    const percentil = ranking.length > 1 ? Math.round((mejores / ranking.length) * 100) : 50;

    container.innerHTML = `
      <p style="margin-bottom:15px; font-size:0.95rem; color:#334155;">
        📊 Con un <strong>${porcentaje}%</strong> de aciertos, superas al <strong>${percentil}%</strong> de los participantes registrados.
      </p>
      <h4 style="margin-bottom:12px; border-bottom:2px solid #e2e8f0; padding-bottom:6px; color:#0f172a;">Ranking en Directo</h4>
      <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.95rem;">
              <thead>
                  <tr style="background:#f8fafc; border-bottom:2px solid #e2e8f0;">
                      <th style="padding:10px;">Pos</th>
                      <th style="padding:10px;">Participante</th>
                      <th style="padding:10px;">Aciertos</th>
                      <th style="padding:10px;">Precisión</th>
                  </tr>
              </thead>
              <tbody>
                  ${ranking.slice(0, 10).map((item, idx) => {
                      const medalla = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                      const esEste = item.nombre === nombreUsuarioActual || item.esActual;
                      const highlight = esEste ? 'background-color:#eff6ff; font-weight:bold;' : '';
                      return `
                          <tr style="${highlight} border-bottom:1px solid #e2e8f0;">
                              <td style="padding:10px;">${medalla}</td>
                              <td style="padding:10px;">${escapeHtml(item.nombre)} ${esEste ? '<span style="background:#2563eb; color:#fff; font-size:0.7rem; padding:2px 6px; border-radius:4px; margin-left:6px;">Tú</span>' : ''}</td>
                              <td style="padding:10px;">${item.aciertos}/${item.total}</td>
                              <td style="padding:10px;">
                                  <div style="width:90px; height:8px; background:#e2e8f0; border-radius:4px; display:inline-block; vertical-align:middle; margin-right:8px; overflow:hidden;">
                                      <div style="height:100%; width:${item.porcentaje}%; background:#10b981;"></div>
                                  </div>
                                  <strong>${item.porcentaje}%</strong>
                              </td>
                          </tr>
                      `;
                  }).join('')}
              </tbody>
          </table>
      </div>
    `;
  }
  // ------------------------------------------

  function renderResult() {
    const quiz = data.quizzes[activeQuizKey];
    const score = answers.reduce((sum, answer, index) => sum + (answer === quiz.questions[index][2] ? 1 : 0), 0);
    const total = quiz.questions.length;
    const porcentaje = Math.round((score / total) * 100);
    const message = score >= 9 ? '¡Excelente! Tienes muy claros los conceptos.' : score >= 7 ? '¡Buen trabajo! Has comprendido gran parte del contenido.' : score >= 5 ? 'Vas por buen camino. Repasa las explicaciones y vuelve a intentarlo.' : 'Este es un buen punto de partida para aprender. Revisa las fichas y prueba otra vez.';
    
    quizPanel.innerHTML = `
      <div class="quiz-result">
        <div class="section-kicker">Cuestionario completado</div>
        <div class="quiz-score">${score}<span style="font-size:25px;color:#94a18f"> / ${total}</span></div>
        <h3>${escapeHtml(message)}</h3>
        <p>Has respondido las diez preguntas de ${escapeHtml(quiz.title.toLowerCase())}. Tu precisión es del <strong>${porcentaje}%</strong>.</p>
        
        <div class="quiz-name-box" style="background:#f8fafc; border:1px solid #e2e8f0; padding:16px; border-radius:8px; margin:20px 0; text-align:left;">
          <label for="userNameInput" style="display:block; font-weight:600; margin-bottom:8px; color:#0f172a;">Introduce tu nombre para guardar tu resultado en el ranking:</label>
          <div style="display:flex; gap:10px;">
            <input type="text" id="userNameInput" placeholder="Ej. Marc Fresquet" style="flex:1; padding:10px 14px; border:1px solid #cbd5e1; border-radius:6px; font-size:1rem;">
            <button id="saveScoreBtn" class="quiz-next" type="button" style="padding:10px 20px; cursor:pointer;">Guardar</button>
          </div>
        </div>

        <div id="rankingContainer" style="margin-top:20px; text-align:left;"></div>

        <div class="debate-box" style="margin-top:20px;">
          <strong>Para reflexionar</strong>
          <p>${escapeHtml(quiz.debate)}</p>
          <textarea id="debateAnswer" placeholder="Escribe aquí tu reflexión (opcional)..." aria-label="Tu reflexión"></textarea>
        </div>
        <div class="quiz-actions" style="margin-top:20px;">
          <button class="quiz-close" id="reviewQuiz" type="button">Revisar respuestas</button>
          <button class="quiz-restart" id="restartQuiz" type="button">Repetir cuestionario ↻</button>
        </div>
      </div>`;

    const saveBtn = document.getElementById('saveScoreBtn');
    const nameInput = document.getElementById('userNameInput');

    saveBtn.addEventListener('click', () => {
      const nombre = nameInput.value.trim() || "Anónimo";
      guardarYMostrarRanking(nombre, score, total, porcentaje, activeQuizKey);
    });

    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveBtn.click();
      }
    });

    // Renderizar tabla inicial del ranking antes de guardar
    renderizarTablaRanking(null, score, total, porcentaje, activeQuizKey);

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
