$(document).ready(function () {
  const messageContainer = $('#messageContainer');
  const resumeTable = $('#resumeTableBody');
  const jdTable = $('#jdTableBody');
  const btnUploadJob = $('#btn-upload-job');
  const btnUploadResume = $('#btn-upload-resume');
  
  const ResumeStore = [];
  const JDStore = [];
  let idSeq = 0;

  const hiddenResumeInput = $('<input>', {
    type: 'file',
    multiple: true,
    accept: '.pdf,.doc,.docx,.txt',
    style: 'display: none;'
  }).appendTo(document.body);

  const hiddenJobInput = $('<input>', {
    type: 'file',
    multiple: true,
    accept: '.pdf,.doc,.docx,.txt',
    style: 'display: none;'
  }).appendTo(document.body);

  function showCustomMessage(type, message) {
    const messageHtml = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;
    messageContainer.append(messageHtml);
    setTimeout(() => {
      messageContainer.find('.alert').first().alert('close');
    }, 3000);
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleString();
  }

  function renderResumeTable() {
    if (ResumeStore.length === 0) {
      resumeTable.html('<tr><td colspan="6" class="text-center">Chưa có CV nào được chọn.</td></tr>');
      return;
    }
    const sorted = ResumeStore.slice().sort((a, b) => b.uploadTs - a.uploadTs);
    const rowsHtml = sorted.map(r => `
      <tr class="normal_text" data-id="${r.id}">
        <td class="text-center">
          <div class="form-check d-flex justify-content-center">
            <input class="form-check-input row-checkbox" type="checkbox" style="transform: scale(1.3); cursor: pointer;">
          </div>
        </td>
        <td class="fw-medium">${r.fileName}</td>
        <td class="text-center">${r.phone || '—'}</td>
        <td class="text-center">${formatTime(r.uploadTs)}</td>
        <td><span class="badge bg-warning">pending</span></td>
        <td class="text-center d-flex justify-content-center small_button">
          <a href="${r.url}" target="_blank" class="btn btn-sm btn-outline-success me-1 small_button" style="background-color: #16c09879">View</a>
          <button class="btn btn-sm btn-outline-danger small_button btn-delete" style="background-color: #FFC5C5">Delete</button>
        </td>
      </tr>
    `).join('');
    resumeTable.html(rowsHtml);
  }

  function renderJDTable() {
    if (JDStore.length === 0) {
      jdTable.html('<tr><td colspan="5" class="text-center">Chưa có JD nào được chọn.</td></tr>');
      return;
    }
    const sorted = JDStore.slice().sort((a, b) => b.uploadTs - a.uploadTs);
    const rowsHtml = sorted.map(r => `
      <tr class="normal_text" data-id="${r.id}">
        <td class="text-center">
          <div class="form-check d-flex justify-content-center">
            <input class="form-check-input row-checkbox" type="checkbox" style="transform: scale(1.3); cursor: pointer;">
          </div>
        </td>
        <td class="fw-medium">${r.fileName}</td>
        <td class="text-center">${formatTime(r.uploadTs)}</td>
        <td class="text-center">
            <div class="d-flex justify-content-center align-items-center small_button">
                <a href="${r.url}" target="_blank" 
                class="btn btn-sm btn-outline-success me-1 small_button" 
                style="background-color: #16c09879">View</a>
                <button class="btn btn-sm btn-outline-danger small_button btn-delete" 
                style="background-color: #FFC5C5">Delete</button>
            </div>
        </td>
      </tr>
    `).join('');
    jdTable.html(rowsHtml);
  }

  function makeRecord(file) {
    const id = `${Date.now()}_${++idSeq}`;
    return {
      id,
      fileName: file.name,
      url: URL.createObjectURL(file),
      uploadTs: Date.now(),
      phone: null,
      email: null,
      status: 'pending'
    };
  }

  // Handlers riêng
  hiddenResumeInput.on('change', function (e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) {
      showCustomMessage('warning', 'No files selected.');
      return;
    }
    files.forEach(f => {
      const rec = makeRecord(f);
      ResumeStore.push(rec);
      showCustomMessage('success', `Added resume: ${f.name}`);
    });
    renderResumeTable();
    this.value = '';
  });

  hiddenJobInput.on('change', function (e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) {
      showCustomMessage('warning', 'No files selected.');
      return;
    }
    files.forEach(f => {
      const rec = makeRecord(f);
      JDStore.push(rec);
      showCustomMessage('success', `Added JD: ${f.name}`);
    });
    renderJDTable();
    this.value = '';
  });

  btnUploadResume.on('click', function () {
    hiddenResumeInput.click();
  });

  btnUploadJob.on('click', function () {
    hiddenJobInput.click();
  });

  renderResumeTable();
  renderJDTable();
});
