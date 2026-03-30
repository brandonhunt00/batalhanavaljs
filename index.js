document.addEventListener('DOMContentLoaded', () => {
  const btnStart  = document.getElementById('btn-start');
  const input1    = document.getElementById('player1');
  const input2    = document.getElementById('player2');
  const errorMsg  = document.getElementById('error-msg');
  const p1Group   = document.getElementById('p1-group');
  const p2Group   = document.getElementById('p2-group');

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.opacity = '1';
  }

  function clearError() {
    errorMsg.textContent = '';
    errorMsg.style.opacity = '0';
  }

  function highlightInvalid(group) {
    group.querySelector('.input-wrapper').style.borderColor = '#e74c3c';
    group.querySelector('.input-wrapper').style.boxShadow = '0 0 0 3px rgba(231,76,60,0.2)';
    setTimeout(() => {
      group.querySelector('.input-wrapper').style.borderColor = '';
      group.querySelector('.input-wrapper').style.boxShadow = '';
    }, 2000);
  }

  btnStart.addEventListener('click', () => {
    const name1 = input1.value.trim();
    const name2 = input2.value.trim();

    clearError();

    if (!name1 && !name2) {
      showError('Por favor, insira os nomes dos dois jogadores!');
      highlightInvalid(p1Group);
      highlightInvalid(p2Group);
      return;
    }
    if (!name1) {
      showError('Digite o nome do Capitão 1!');
      highlightInvalid(p1Group);
      return;
    }
    if (!name2) {
      showError('Digite o nome do Capitão 2!');
      highlightInvalid(p2Group);
      return;
    }
    if (name1.toLowerCase() === name2.toLowerCase()) {
      showError('Os capitães precisam ter nomes diferentes!');
      highlightInvalid(p2Group);
      return;
    }

    const params = new URLSearchParams({ p1: name1, p2: name2 });
    window.location.href = `game.html?${params.toString()}`;
  });

  [input1, input2].forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btnStart.click();
    });
    input.addEventListener('input', clearError);
  });
});
